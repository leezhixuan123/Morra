import React from 'react'
import AppViews from './views/AppViews'
import DeployerViews from './views/DeployerViews'
import AttacherViews from './views/AttacherViews'
import {renderDOM, renderView} from './views/render'
import './index.css'
import {loadStdlib} from '@reach-sh/stdlib'
import * as backend from './build/index.main.mjs'
const reach = loadStdlib(process.env)

import { ALGO_MyAlgoConnect as MyAlgoConnect } from '@reach-sh/stdlib'
reach.setWalletFallback(reach.walletFallback({providerEnv: 'TestNet', MyAlgoConnect}))
const {standardUnit} = reach;
const defaultValues = {defaultWager: '5', standardUnit}
const RESULT = ['Alice wins!', 'Draw!', 'Bob wins!']

class App extends React.Component{
  constructor(props){
    super(props)
    this.state = {view: 'ConnectAccount', ...defaultValues}
  }
  async componentDidMount(){
    const acc = await reach.getDefaultAccount()
    const balAtomic = await reach.balanceOf(acc)
    const bal = reach.formatCurrency(balAtomic, 4)
    this.setState({acc, bal})
    if(await reach.canFundFromFaucet()){
      this.setState({view: 'FundAccount'})
    } else{
      this.setState({view: 'DeployerOrAttacher'})
    }
  }
  render(){
    return renderView(this, AppViews)
  }
  async fundAccount(fundAmount){
    await reach.fundFromFaucet(this.state.acc, reach.parseCurrency(fundAmount))
    this.setState({view: 'DeployerOrAttacher'})
  }
  async skipFundAccount(){
    this.setState({view:'DeployerOrAttacher'})
  }

  selectAttacher(){
    this.setState({view: 'Wrapper', ContentView: Attacher})
  }
  selectDeployer(){
    this.setState({view: 'Wrapper', ContentView: Deployer})
  }
}

class commonActions extends React.Component{
    /*
    ...hasRandom,
    getFingers: Fun{[], UInt},
    getGuess: Fun([], UInt),
    seeOutcome: Fun([Bytes(128)], Null),
    informTimeout: Fun([], Null)
    */
  random(){
    return reach.hasRandom.random()
  }
  async getFingers(){
    const fingers = await new Promise(resolveFingerP =>
      this.setState({view: 'GetFingers', playable: true, resolveFingerP}))
    this.setState({fingers})
    return fingers
  }
  showFinger(finger){
    this.state.resolveFingerP(finger)
  }
  setGuess(guess){
    this.state.resolveGuessP(guess)
  }
  async getGuess(){
    const guess = await new Promise(resolveGuessP => {
      this.setState({view: 'GetGuess', playable: true, resolveGuessP})})
    this.setState({view: 'WaitingForResults', guess})
    return guess
  }
  seeOutcome(result){
    this.setState({view:'Done', outcome: RESULT[result] })
  }
  informTimeout(){
    this.setState({view:'Timeout'})
  }
}

class Deployer extends commonActions{
  constructor(props){
    super(props)
    this.state = {view: 'SetWager'}
  }
  setWager(wager){
      this.setState({view:'Deploy', wager})
  }
  async deploy(){
    const ctc = this.props.acc.contract(backend)
    this.setState({view:'Deploying', ctc})
    this.wager = reach.parseCurrency(this.state.wager)
    this.deadline = {ETH: 100, ALGO: 100, CFX: 1000} [reach.connector]
    backend.Alice(ctc, this)
    const ctcInfoStr = JSON.stringify(await ctc.getInfo(), null, 2)
    this.setState({view: 'WaitingForAttacher', ctcInfoStr})
  }
  render(){
      return renderView(this, DeployerViews)
  }
}

class Attacher extends commonActions{
  constructor(props){
    super(props)
    this.state = {view: 'Attach'}
  }
  attach(ctcInfoStr){
    const ctc = this.props.acc.contract(backend, JSON.parse(ctcInfoStr))
    this.setState({view: 'Attaching'})
    backend.Bob(ctc, this)
  }
  async acceptWager(wagerAtomic){
      const wager = reach.formatCurrency(wagerAtomic, 4)
      return await new Promise(resolveAcceptedP => {
          this.setState({view: 'AcceptTerms', wager, resolveAcceptedP})
      })
  }
  termsAccepted(){
      this.state.resolveAcceptedP()
      this.setState({view: 'WaitingForTurn'})
  }
  render(){
      return renderView(this, AttacherViews)
  }
}

renderDOM(<App />)