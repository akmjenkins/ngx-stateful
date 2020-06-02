import { createSelector } from 'reselect';
import { map } from 'rxjs/operators';
import { StatefulComponent, StateSetter } from '../src/index';
import { tick } from '../test.utils';



interface MyState {
    fetching: boolean;
    data: string[];
    error: boolean;
}

class Fixture extends StatefulComponent<MyState> {

    public fetching$ = this.selectKey<MyState['error']>('fetching');
    public error$ = this.selectKey<MyState['error']>('error');
    public data$ = this.selectKey<MyState['data']>('data');

    constructor(state: MyState) {
        super(state);
    }

    public async partialFetcher(data: Promise<string[]>) {
        this.setState({fetching:true});

        try {
            this.setState({data: await data});
        } catch {
            this.setState({error:true});
        }

        this.setState({fetching:false});
    }

    public async fnFetcher(data: Promise<string[]>) {
        this.setState(state => ({...state,fetching:true}));

        try {
            const d = await data;
            this.setState(state => ({...state,data:d}));
        } catch {
            this.setState(state => ({...state,error:true}));
        }

        this.setState(state => ({...state,fetching:false}));
    }

    public fakeSetState(state: StateSetter<MyState>) {
        this.setState(state);
    }
}

describe('stateful',() => {
    const initialState = {
        fetching:false,
        data:[],
        error: false,
    };
    let instance: Fixture;
    beforeEach(() => {
        instance = new Fixture(initialState);
    });

    it('should work',() => {
        expect(instance.state).toEqual(initialState);
    });

    it('should update state (with a partial)',async () => {
        const data = ['one','two','three'];
        instance.partialFetcher(new Promise(res => res(data)));
        expect(instance.state.fetching).toBe(true);
        expect(instance.state.data).not.toBe(data);
        await tick();
        expect(instance.state.fetching).toBe(false);
        expect(instance.state.data).toBe(data);

    });

    it('should update state (with a function)',async () => {
        const data = ['one','two','three'];
        instance.fnFetcher(new Promise(res => res(data)));
        expect(instance.state.fetching).toBe(true);
        expect(instance.state.data).not.toBe(data);
        await tick();
        expect(instance.state.fetching).toBe(false);
        expect(instance.state.data).toBe(data);

    });

    it('should work with a selector',() => {
        const selector = createSelector((state: MyState) => state,({fetching}) => fetching);
        const pipe = map(({fetching}) => fetching);
        const spy = jest.fn();
        const spyWithoutSelector = jest.fn();
        instance.state$.pipe(pipe).subscribe(spyWithoutSelector);
        instance.select(selector).subscribe(spy);

        expect(spyWithoutSelector).toHaveBeenCalledTimes(1);
        expect(spyWithoutSelector).toHaveBeenCalledWith(false);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(false);
        spy.mockClear();
        spyWithoutSelector.mockClear();
        instance.fakeSetState({error:true});
        expect(spy).toHaveBeenCalledTimes(0);
        expect(spyWithoutSelector).toHaveBeenCalledTimes(1);
    });

    it('should work with a key selector',() => {
        const pipe = map(({fetching}) => fetching);
        const spy = jest.fn();
        const spyWithoutSelector = jest.fn();
        instance.state$.pipe(pipe).subscribe(spyWithoutSelector);
        instance.selectKey<boolean>('fetching').subscribe(spy);

        expect(spyWithoutSelector).toHaveBeenCalledTimes(1);
        expect(spyWithoutSelector).toHaveBeenCalledWith(false);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(false);
        spy.mockClear();
        spyWithoutSelector.mockClear();
        instance.fakeSetState({error:true});
        expect(spy).toHaveBeenCalledTimes(0);
        expect(spyWithoutSelector).toHaveBeenCalledTimes(1);
    });

    it('should call onChange',() => {
        const spy = jest.fn();
        instance.onKeyChange('fetching').subscribe(spy);
        expect(spy).not.toHaveBeenCalled();
        instance.fakeSetState({error:true});
        expect(spy).not.toHaveBeenCalled();
        instance.fakeSetState({fetching:true});
        expect(spy).toHaveBeenCalledWith([initialState.fetching,true]);
    });



});