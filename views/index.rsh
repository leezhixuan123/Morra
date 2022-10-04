'reach 0.1';

const commonActions = {
  ...hasRandom,
  getFingers: Fun([], UInt),
  getGuess: Fun([], UInt),
  seeOutcome: Fun([UInt], Null),
  informTimeout: Fun([], Null)
}

const [ OUTCOME, Alice_wins, Draw, Bob_wins] = makeEnum(3)

const computeResult = (fA, fB, gA, gB) => {
  const correctGuess = fA + fB
  if(gA == correctGuess && gB == correctGuess){
    return Draw
  } else if(gA == correctGuess){
      return Alice_wins
  } else if(gB == correctGuess){
      return Bob_wins
  } else{
    return Draw
  }
}

forall(UInt, fingersAlice =>
  forall(UInt, fingersBob =>
    forall(UInt, guessAlice =>
      forall(UInt, guessBob =>
        assert(OUTCOME(computeResult(fingersAlice, fingersBob, guessAlice, guessBob)))
      )
    )
  )
);

export const main = Reach.App(() => {
  const Alice = Participant('Alice', {
    ...commonActions,
    wager: UInt,
    deadline: UInt
  });
  const Bob = Participant('Bob', {
    ...commonActions,
    acceptWager: Fun([UInt], Null),
  });

  init();

  const informTimeout = () => {
    each( [Alice, Bob], () => {
      interact.informTimeout()
    })
  }

  Alice.only(() => {
    const wager = declassify(interact.wager)
    const deadline = declassify(interact.deadline)
  })
  Alice.publish(wager, deadline).pay(wager)
  commit()
  Bob.only(() => {
    interact.acceptWager(wager)
  })
  Bob.pay(wager).timeout(relativeTime(deadline), () => {
      closeTo(Alice, informTimeout)
  })

  var outcome = Draw
  invariant( balance() == 2*wager && OUTCOME(outcome))
  while (outcome == Draw){

    commit()
    Alice.only(() => {
      const _fingersAlice = interact.getFingers()
      const [_commitAlice, _saltAlice] = makeCommitment(interact, _fingersAlice)
      const commitAlice = declassify(_commitAlice)
      const _guessAlice = interact.getGuess()
      const [_commitAlice2, _saltAlice2] = makeCommitment(interact, _guessAlice)
      const commitAlice2 = declassify(_commitAlice2)
    })
    Alice.publish(commitAlice,commitAlice2).timeout(relativeTime(deadline), () => {
      closeTo(Bob, informTimeout)
    })
    commit();

    unknowable(Bob, Alice(_fingersAlice, _saltAlice, _guessAlice, _saltAlice2))

    Bob.only(() => {
      const fingersBob = declassify(interact.getFingers())
      const guessBob = declassify(interact.getGuess())
    })
    Bob.publish(fingersBob, guessBob).timeout(relativeTime(deadline), () => {
      closeTo(Alice, informTimeout)
    })
    commit();

    Alice.only(() => {
      const fingersAlice = declassify(_fingersAlice)
      const saltAlice = declassify(_saltAlice)
      const guessAlice = declassify(_guessAlice)
      const saltAlice2 = declassify(_saltAlice2)
    })
    Alice.publish(fingersAlice, saltAlice, guessAlice, saltAlice2).timeout(relativeTime(deadline), () => {
      closeTo(Bob, informTimeout)
    })
    checkCommitment(commitAlice, saltAlice, fingersAlice)
    checkCommitment(commitAlice2, saltAlice2, guessAlice)

    outcome = computeResult(fingersAlice, fingersBob, guessAlice, guessBob)
    
    continue
  
  }

  assert(outcome == Alice_wins || outcome == Bob_wins)
  transfer(2*wager).to(outcome == Alice_wins? Alice : Bob)
  commit()
  each([Alice, Bob],  () => {
      interact.seeOutcome(outcome == Alice_wins? 0: outcome == Draw? 1: 2)
  })
  exit()
});
