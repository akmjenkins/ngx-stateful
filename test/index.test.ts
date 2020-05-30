import { Observable } from 'rxjs';
import { StatefulComponent } from '../src/index';
import { tick } from '../test.utils';

jest.useFakeTimers();

interface MyState {
    fetching: boolean;
    data: string[];
    error: boolean;
}

class Fixture extends StatefulComponent<MyState> {

    public myOnChange$: Observable<[MyState,MyState]>;

    constructor(state: MyState) {
        super(state);
        // onChange is protected - this little hack let's me test it
        this.myOnChange$ = this.onChange$;
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
}

describe('stateful',() => {

    it('should work',() => {
        const initialState = {
            fetching:false,
            data:[],
            error: false,
        };

        const fixture = new Fixture(initialState);
        expect(fixture.state).toEqual(initialState);
    });

    it('should update state (with a partial)',async () => {
        const initialState = {
            fetching:false,
            data:[],
            error: false,
        };

        const fixture = new Fixture(initialState);
        const data = ['one','two','three'];
        fixture.partialFetcher(new Promise(res => res(data)));
        expect(fixture.state.fetching).toBe(true);
        expect(fixture.state.data).not.toBe(data);
        await tick();
        expect(fixture.state.fetching).toBe(false);
        expect(fixture.state.data).toBe(data);

    });

    it('should update state (with a function)',async () => {
        const initialState = {
            fetching:false,
            data:[],
            error: false,
        };

        const fixture = new Fixture(initialState);
        const data = ['one','two','three'];
        fixture.fnFetcher(new Promise(res => res(data)));
        expect(fixture.state.fetching).toBe(true);
        expect(fixture.state.data).not.toBe(data);
        await tick();
        expect(fixture.state.fetching).toBe(false);
        expect(fixture.state.data).toBe(data);

    });

    it('should call onChange correctly', async () => {
        const initialState = {
            fetching:false,
            data:[],
            error: false,
        };

        const fixture = new Fixture(initialState);
        const spy = jest.fn();
        fixture.myOnChange$.subscribe(spy);
        expect(spy).not.toHaveBeenCalled();
        const data = ['one','two','three'];
        fixture.partialFetcher(new Promise(res => res(data)));
        const firstState = {...initialState,fetching:true};
        expect(spy).toHaveBeenCalledWith([initialState,firstState]);
        spy.mockClear();
        await tick();
        const secondState = {...firstState,data};
        expect(spy).toHaveBeenCalledWith([firstState,secondState]);
    });

});