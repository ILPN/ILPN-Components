import {createMockTrace} from '../../../utility/test/create-mock-trace';


describe('Trace', () => {
    it('should equal', () => {
        const t1 = createMockTrace('a', 'a', 'b');
        const t2 = createMockTrace('a', 'a', 'b');
        const t3 = createMockTrace('a', 'b');
        const t4 = createMockTrace('a', 'a', 'a');
        expect(t1.equals(t1)).toBeTrue();
        expect(t1.equals(t2)).toBeTrue();
        expect(t2.equals(t1)).toBeTrue();
        expect(t1.equals(t3)).toBeFalse();
        expect(t3.equals(t1)).toBeFalse();
        expect(t1.equals(t4)).toBeFalse();
        expect(t4.equals(t1)).toBeFalse();
    });
});
