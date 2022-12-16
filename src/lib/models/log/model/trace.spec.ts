import {createMockTrace} from '../../../utility/test/create-mock-trace';


describe('Trace', () => {
    it('should equal', () => {
        const t1 = createMockTrace([{n:'a'}, {n: 'a'}, {n: 'b'}]);
        const t2 = createMockTrace([{n:'a'}, {n: 'a'}, {n: 'b'}]);
        const t3 = createMockTrace([{n:'a'}, {n: 'b'}]);
        const t4 = createMockTrace([{n:'a'}, {n: 'a'}, {n: 'a'}]);
        expect(t1.equals(t1)).toBeTrue();
        expect(t1.equals(t2)).toBeTrue();
        expect(t2.equals(t1)).toBeTrue();
        expect(t1.equals(t3)).toBeFalse();
        expect(t3.equals(t1)).toBeFalse();
        expect(t1.equals(t4)).toBeFalse();
        expect(t4.equals(t1)).toBeFalse();
    });
});
