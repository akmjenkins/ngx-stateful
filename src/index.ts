import { BehaviorSubject, Observable } from 'rxjs';
import { pairwise } from 'rxjs/operators';

type StateSetterFunction<T> = (state: T) => T;
type StateSetter<T> = Partial<T> | StateSetterFunction<T>;

export abstract class StatefulComponent<T> {

  private _state: BehaviorSubject<T>;
  public state$: Observable<T>;

  // does this even make sense?
  public get state(): T {
    return this._state.value;
  }

  protected onChange$: Observable<[T,T]>;

  constructor(_state: T) {
    this._state = new BehaviorSubject(_state);
    this.state$ = this._state.asObservable();
    this.onChange$ = this.state$.pipe(pairwise());
  }

  protected setState(state: StateSetter<T>) {
    this._state.next(
      typeof state === 'function' ?
        state(this._state.value) :
        ({...this._state.value, ...state}));
  }

}