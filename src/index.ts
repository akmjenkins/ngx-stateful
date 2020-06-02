import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map, pairwise, startWith } from 'rxjs/operators';

type StateSetterFunction<T> = (state: T) => T;
export type StateSetter<T> = Partial<T> | StateSetterFunction<T>;
export abstract class StatefulComponent<T> {

  private _state: BehaviorSubject<T>;
  public state$: Observable<T>;

  public get state(): T {
    return this._state.value;
  }

  public select<R>(selector: (state: T) => R) {
    return this.state$.pipe(map(selector),distinctUntilChanged());
  }

  public selectKey<R>(key: string) {
    return this.select<R>(state => state[key]);
  }

  public onChange<R>(selector: (state: T) => R) {
    return this.select<R>(selector).pipe(pairwise());
  }

  public onKeyChange<R>(key: string) {
    return this.onChange<R>((state: T) => state[key]);
  }

  constructor(_state: T) {
    this._state = new BehaviorSubject(_state);
    this.state$ = this._state.asObservable();
  }

  protected setState(state: StateSetter<T>) {
    this._state.next(
      typeof state === 'function' ?
        state(this._state.value) :
        ({...this._state.value, ...state}));
  }

}