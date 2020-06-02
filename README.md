# ngx-stateful

[![npm version](https://img.shields.io/npm/v/ngx-stateful.svg)](https://npmjs.org/package/ngx-stateful)
[![Coverage Status](https://coveralls.io/repos/github/akmjenkins/ngx-stateful/badge.svg)](https://coveralls.io/github/akmjenkins/ngx-stateful)
[![Build Status](https://travis-ci.com/akmjenkins/ngx-stateful.svg)](https://travis-ci.com/akmjenkins/ngx-stateful)
[![Bundle Phobia](https://badgen.net/bundlephobia/minzip/ngx-stateful)](https://bundlephobia.com/result?p=ngx-stateful)

## Why Stateful?

First of all, you probably don't need this package, it's completely trivial to implement yourself using a [stateSubject](https://www.bennadel.com/blog/3522-creating-a-simple-setstate-store-using-an-rxjs-behaviorsubject-in-angular-6-1-10.htm). It looks like [ngrx has tried to do this](https://ngrx.io/guide/component-store) but (unpopular opinion ahead) dependency injection in Angular is not the way to go. Not because DI is inherently bad, but because most developers just don't use it for it's intended purpose. Instead of relying on abstract dependencies and "programming to the interface", it's used simply to share state around various services in the application in weird ways that are hard to debug.

Secondly, just because your application uses state (spoiler alert: every application has state), doesn't mean it needs all the boilerplate of a [redux implementation](https://ngrx.io/guide/store).

After working on an (unncessary) large scale angular application with way too many components with devs who had a variety of skill levels, I realized how unclear the concept of `State` is to a lot of developers, even though they may be using redux to manage their state.

I blame OOP principles (yeah, I said it). When components are backed by instances of classes, often developers tend to put instance variables on their components without fully realizing that, by doing so, **they are causing that component to become a StatefulComponent** (see [StatefulWidget](https://api.flutter.dev/flutter/widgets/StatefulWidget-class.html) if you know anything about [Flutter](https://api.flutter.dev/index.html)). 

Aside - this is also the reason why I'm such a big fan of [React](https://reactjs.org) moving to functional components - not because react is better, but just because it tries to force developers to critically think about state before using it (typing [`useState`](https://reactjs.org/docs/hooks-reference.html#usestate) comes with more forethought than `this.someString = 'fred'`, IMO.)

Back to Angular components with instance variables - these components then **own something**, and when state is scattered up and down your component tree (without it being clearly identifiable - does this component class have instance variables? How are they used?) then it just becomes a nightmare to onboard yourself into a large codebase.

So let's start making it obnoxiusly clear to all of your team members when a component in Angular owns state - it must extend `StatefulComponent<T>`, and whenever something about that state changes, it must call `setState`.

It provides some neat helper methods that make it easy to discern when and why state is being updated without looking through your component file for `this.someProp = X` and then checking your template file to see if `someProp` is being bound to something in the template.

## Aren't you just trying to make Angular like React?

**YES**... kind of, but that's because it **is** like React. React, Vue, Angular, and Flutter are all effectively the same - they render a tree of components, some of which own state (instance members? computed properties?) and they need to update themselves (render) when things change. All of these frameworks can be written in the exact same style, and they probably should be, it makes moving between applications written in in various frameworks tremendously easy, and unidirectional data flow and composable component pattern of building user interface applications have easily won the day, so we might as we as developers should embrace it fully rather than trying to invent new ones each time a new framework shows up - looking at you [BLOC](https://medium.com/@aaron.chu/flutter-state-management-bloc-pattern-9cd6011c699).


## How to use

```js
import { StatefulComponent } from 'ngx-stateful';

interface MyState {
    fetching: boolean;
    data?: string[];
    error: false;
}

@Component({
    selector:'app',
    template:`
        <ng-container *ngIf="fetching$ | async; then spinner; else result"></ng-container>

        <ng-template #result>
            <ng-container *ngIf="error$ | async; then error; else data"></ng-container>
        </ng-template>

        <ng-template #spinner>
            <mat-progress-spinner></mat-progress-spinner>
        </ng-template>

        <ng-template #error>
            <app-error-component [error]="error$ | async"></app-error-component>
        </ng-template>

        <ng-template #data>
            <app-my-data-displayer [data]="data$ | async"></app-my-data-displayer>
        </ng-template>    
    `
})
export class MyComponent extends StatefulComponent<MyState> implements ngOnInit {

    public fetching$ = this.selectKey<MyState['fetching']>('fetching');
    public error$ = this.selectKey<MyState['error']>('error');
    public data$ = this.selectKey<MyState['data']>('data');

    constructor() {
        super({
            fetching:false,
            error:false
        })
    }


    async ngOnInit() {
        this.setState({fetching:true});

        try {
            this.setState({data:await fetchSomeData()});
        } catch(err) {
            this.stateState({error:true});
        }

        this.setState({fetching:false});
    }

}
```

## API

Any component class that extends this must call `super()` with the state:

```js
class MyComponent extends StatefulComponent<MyState> {
    constructor() {
        super({...your state})
    }
}
```
<a name="state"></a>
- `public state: T`

The current **IMMUTABLE** state of the component.

<a name="state$"></a>
- `public state$: Observable<T>`

An observable of your components state, think [async pipe](https://angular.io/api/common/AsyncPipe) in your template.

<a name="setstate"></a>
- `public setState(state: StateSetter<T>)`

Sets the state of the component by either patching it or using the function signature.

```js
private startFetching() {
    // patch function signature
    this.setState({fetching:true});
}

private stopFetching() {
    // callback function signature
    this.setState(state => ({...state,fetching:false}));
}
```

<a name="select"></a>
- `public select<R>(selector: (state: T) => R): Observable<R>`

Retrieve state with a selector (see [reselect](https://github.com/reduxjs/reselect)).

```js
public fetching$ = this.select(state => state,({fetching}) => fetching);
```
<a name="selectkey"></a>
- `public selectKey<R>(key: string): Observable<R>`

Retrieve state by string key (when your state is an object).
```js
public fetching$ = this.selectKey<boolean>('fetching');
```

<a name="onchange"></a>
- `*public onChange<R>(selector: (state: T) => R): Observable<[R,R]>`

Returns on observable that emits only when a certain piece of the state changes.

<a name="onkeychange"></a>
- `*public onKeyChange<R>(key: string): Observable<[R,R]>`

Same deal as [selectKey](#selectkey)


*Note: `onChange` and `onKeyChange` **DO NOT** emit if the piece of state being selected has never changed. See [pairwise](https://www.learnrxjs.io/learn-rxjs/operators/combination/pairwise).