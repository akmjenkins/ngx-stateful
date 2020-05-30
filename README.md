# ngx-stateful

[![npm version](https://img.shields.io/npm/v/ngx-stateful.svg)](https://npmjs.org/package/ngx-stateful)
[![Coverage Status](https://coveralls.io/repos/github/akmjenkins/ngx-stateful/badge.svg)](https://coveralls.io/github/akmjenkins/ngx-stateful)
[![Build Status](https://travis-ci.com/akmjenkins/ngx-stateful.svg)](https://travis-ci.com/akmjenkins/ngx-stateful)
[![Bundle Phobia](https://badgen.net/bundlephobia/minzip/ngx-stateful)](https://bundlephobia.com/result?p=ngx-stateful)

## Why Stateful?

First of all, you don't need this package, it's completely trivial to implement yourself (maybe angular should implement it in core?)

After working on an (unncessary) large scale angular application with way too many components with devs who had a variety of skill levels, I realized few people had any idea what `State` means, despite using (abusing) redux (via [ngrx](https://github.com/ngrx/platform)) to the nth degree.

I blame OOP principles. When components are backed by instances of classes, often developers tend to put instance variables on their components without fully realizing that, by doing so, they are causing that component to become a StatefulComponent (see [StatefulWidget](https://api.flutter.dev/flutter/widgets/StatefulWidget-class.html) if you know anything about [Flutter](https://api.flutter.dev/index.html)).

That component then owns something, and when state is scattered up and down your component tree (without it being clearly identifiable - does this component class have instance variables? How are they used) then it just becomes a nightmare to onboard yourself into a large codebase.

So let's start making it disgustingly clear to all the devs on your team when a component in Angular owns state - it must extend `StatefulComponent<T>`. That's all, nothing else.

It provides some neat helper methods that make it easy to discern when and why state is being updated without looking through your component file for `this.someProp = X` and then checking your template file to see if `someProp` is being bound to something in the template.


## How to use

```
import { StatefulComponent } from 'ngx-stateful';

interface MyState {
    fetching: boolean;
    data: string[];
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

    public fetching$ = this.state$.pipe(map(({fetching}) => fetching));
    public error$ = this.state$.pipe(map(({error}) => error));
    public data$ = this.state$.pipe(map(({data}) => data));

    constructor() {
        super({
            fetching:false,
            data:[],
            error:false
        })
    }


    async ngOnInit() {
        this.setState({fetching:true});

        try {
            const data = await fetchSomeData(...)
            this.setState({data});
        } catch(err) {
            this.stateState({error:true});
        }

        this.setState({fetching:false});
    }

}
```

## API

Any component class that extends this must call `super()` with the state:

```
class MyComponent extends StatefulComponent<MyState> {
    constructor() {
        super({...your state})
    }
}
```

 

- `public state: T`

The current **IMMUTABLE** state of the component.

- `public state$: Observable<T>`

An observable of your components state, think [async pipe](https://angular.io/api/common/AsyncPipe) in your template.

- `public setState(state: StateSetter<T>)`

Sets the state of the component by either patching it or using the function signature.