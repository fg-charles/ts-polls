import React, { Component } from 'react';
import { PollList } from './PollList';
import { PollDetails } from './PollDetails';
import { NewPoll } from './NewPoll';


// Indicates which page to show. If it is the details page, the argument
// includes the specific poll to show the details of.
type Page = "list" | "new" | {kind: "details", name: string}; 

// RI: If page is "details", then index is a valid index into polls array.
type AppState = {page: Page};

// Whether to show debugging information in the console.
const DEBUG: boolean = true;


// Top-level component that displays the appropriate page.
export class App extends Component<{}, AppState> {

  constructor(props: {}) {
    super(props);
    this.state = {page: "list"};
  }

  render = (): JSX.Element => {
    if (this.state.page === "list") {
      if (DEBUG) console.debug("rendering list page");
      return <PollList onNewClick={this.doNewClick}
                          onPollClick={this.doPollClick}/>;

    } else if (this.state.page === "new") {
      if (DEBUG) console.debug("rendering add page");
      return <NewPoll onBackClick={this.doBackClick}/>;

    } else {  // details
      if (DEBUG) console.debug(`rendering details page for "${this.state.page.name}"`);
      return <PollDetails name={this.state.page.name}
                             onBackClick={this.doBackClick}/>;
    }
  };
  
  doNewClick = (): void => {
    if (DEBUG) console.debug("set state to new");
    this.setState({page: "new"});
  };
  
  doPollClick = (name: string): void => {
    if (DEBUG) console.debug(`set state to details for poll ${name}`);
    this.setState({page: {kind: "details", name}});
  };
  
  doBackClick = (): void => {
    if (DEBUG) console.debug("set state to list");
    this.setState({page: "list"});
  };
}
