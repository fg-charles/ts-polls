import React, { Component, ChangeEvent, MouseEvent } from 'react';
import { Poll, parsePoll } from './poll';
import { isRecord } from './record';


type DetailsProps = {
  name: string,
  onBackClick: () => void,
};

type DetailsState = {
  now: number,
  poll: Poll | undefined,
  voter: string,
  vote: string,
  error: string
};


// Shows an individual poll and allows voting (if ongoing).
export class PollDetails extends Component<DetailsProps, DetailsState> {

  constructor(props: DetailsProps) {
    super(props);

    this.state = {now: Date.now(), poll: undefined,
                  voter: "", vote: "", error: ""};
  }

  componentDidMount = (): void => {
    this.doRefreshClick(); 
  };

  render = (): JSX.Element => {
    if (this.state.poll === undefined) {
      return <p>Loading poll "{this.props.name}"...</p>
    } else {
      if (this.state.poll.endTime <= this.state.now) {
        return this.renderCompleted(this.state.poll);
      } else {
        return this.renderOngoing(this.state.poll);
      }
    }
  };

  renderCompleted = (poll: Poll): JSX.Element => {
    // Please the compiler.
    if (this.state.poll === undefined)
      throw new Error('Impossible');
    // CALCULATE RESULTS
    const results: Map<string, number> = new Map(); // Option percentage key pairs.
    // Get number of votes per option.
    console.log(this.state.poll);
    for (const vote of Object.entries(this.state.poll.votes)) {
      const item = vote[1];
      console.log(vote);
      const item_in_res = results.get(item);
      if (item_in_res !== undefined) {
	results.set(item, item_in_res + 1);
      } else {
	results.set(item, 1);
      }
    }
    console.log(results)
    // Divide everything by number of votes to get percentages
    const num_votes = Object.entries(this.state.poll.votes).length
    for (const [key, value] of results) {
      results.set(key, Math.round((value / num_votes) * 100));
    }
    
    // FORMAT RESULTS INTO LIST
    const res_list: JSX.Element[] = [];
    for (const [option, percentage] of results) {
      res_list.push(<li key={option}>{percentage}% {option}</li>)
    }
    
    const time_since_closed =
	  Math.round((this.state.now - this.state.poll.endTime) / 60000);

    return (
      <div>
        <h2>{poll.name}</h2>
        <p>Closed {time_since_closed} min ago.</p>
	<ul>{res_list}</ul>
	<button type="button" onClick={this.doRefreshClick}>Refresh</button>
	<button type="button" onClick={this.doDoneClick}>Done</button>
	{this.renderError()}
      </div>
      );
  };

  renderOngoing = (poll: Poll): JSX.Element => {
    // Please the compiler
    if (this.state.poll === undefined) 
      throw new Error('Impossible');
    const min = Math.round((poll.endTime - this.state.now) / 60 / 100) / 10;
    const options: JSX.Element[] = [];
    for (const option of this.state.poll.options) {
      options.push(
	<div key={option}>
	  <input checked={this.state.vote===option}
			  onChange={this.doVoteChange}
			  key={option}
			  type="radio"
			  id={option}
			  name="options"
			  value={option}/>
	  <label htmlFor={option}>{option}</label>
	</div>)
    }

    return (
      <div>
        <h2>{poll.name}</h2>
        <p><i>Closes in {min} minutes...</i></p>
        {options}
	<div>
          <label htmlFor="voter">Name:</label>
          <input type="text" id="voter" value={this.state.voter} 
              onChange={this.doVoterChange}></input>
        </div>
        <button type="button" onClick={this.doVoteClick}>Vote</button>
        <button type="button" onClick={this.doRefreshClick}>Refresh</button>
        <button type="button" onClick={this.doDoneClick}>Done</button>
        {this.renderError()}
      </div>);
  };

  renderError = (): JSX.Element => {
    if (this.state.error.length === 0) {
      return <div></div>;
    } else {
      const style = {width: '300px', backgroundColor: 'rgb(246,194,192)',
          border: '1px solid rgb(137,66,61)', borderRadius: '5px', padding: '5px' };
      return (<div style={{marginTop: '15px'}}>
          <span style={style}><b>Error</b>: {this.state.error}</span>
        </div>);
    }
  };

  doRefreshClick = (): void => {
    const args = {name: this.props.name};
    fetch("/api/get", {
        method: "POST", body: JSON.stringify(args),
        headers: {"Content-Type": "application/json"} })
      .then(this.doGetResp)
      .catch(() => this.doGetError("failed to connect to server"));
  };

  doGetResp = (res: Response): void => {
    if (res.status === 200) {
      res.json().then(this.doGetJson)
          .catch(() => this.doGetError("200 res is not JSON"));
    } else if (res.status === 400) {
      res.text().then(this.doGetError)
          .catch(() => this.doGetError("400 response is not text"));
    } else {
      this.doGetError(`bad status code from /api/refersh: ${res.status}`);
    }
  };

  doGetJson = (data: unknown): void => {
    if (!isRecord(data)) {
      console.error("bad data from /api/refresh: not a record", data);
      return;
    }

    this.doPollChange(data);
  }

  // Shared helper to update the state with the new poll.
  doPollChange = (data: {poll?: unknown}): void => {
    const poll = parsePoll(data.poll);
    if (poll !== undefined) {
        this.setState({poll, now: Date.now(), error: ""});
    } else {
      console.error("poll from /api/fresh did not parse", data.poll)
    }
  };

  doGetError = (msg: string): void => {
    console.error(`Error fetching /api/refresh: ${msg}`);
  };

  doVoteChange = (evt: ChangeEvent<HTMLInputElement>): void => {
    this.setState({vote: evt.target.value, error: ""});
  }

  doVoterChange = (evt: ChangeEvent<HTMLInputElement>): void => {
    this.setState({voter: evt.target.value, error: ""});
  };

  doVoteClick = (_: MouseEvent<HTMLButtonElement>): void => {
    if (this.state.poll === undefined)
      throw new Error("impossible");

    // Verify that the user entered all required information.
    if (this.state.voter.trim().length === 0 ||
        this.state.vote.trim().length === 0) {
      this.setState({error: "a required field is missing."});
      return;
    }

    // Verify that vote is an option.
    if (this.state.poll.options.find((element) => element == this.state.vote)
	=== undefined) {
      this.setState({error: "vote is not a valid option"});
      return;
    }

    const args = {name: this.props.name, voter: this.state.voter,
		  vote:this.state.vote};
    fetch("/api/vote", {
        method: "POST", body: JSON.stringify(args),
        headers: {"Content-Type": "application/json"} })
      .then(this.doVoteResp)
      .catch(() => this.doVoteError("failed to connect to server"));
  };

  doVoteResp = (res: Response): void => {
    if (res.status === 200) {
      res.json().then(this.doVoteJson)
          .catch(() => this.doVoteError("200 response is not JSON"));
    } else if (res.status === 400) {
      res.text().then(this.doVoteError)
          .catch(() => this.doVoteError("400 response is not text"));
    } else {
      this.doVoteError(`bad status code from /api/vote: ${res.status}`);
    }
  };

  doVoteJson = (data: unknown): void => {
    if (this.state.poll === undefined)
      throw new Error("impossible");

    if (!isRecord(data)) {
      console.error("bad data from /api/vote: not a record", data);
      return;
    }

    this.doPollChange(data);
  };

  doVoteError = (msg: string): void => {
    console.error(`Error fetching /api/vote: ${msg}`);
  };

  doDoneClick = (_: MouseEvent<HTMLButtonElement>): void => {
    this.props.onBackClick();  // tell the parent to show the full list again
  };
}
