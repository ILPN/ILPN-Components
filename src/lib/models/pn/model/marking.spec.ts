import {Marking} from './marking';


describe('Marking', () => {
    it('should create', () => {
        let m = new Marking({'a': 1, 'b': 0});
        expect(m).toBeTruthy();
        expect(m.get('a')).toBe(1);
        expect(m.get('b')).toBe(0);
        m = new Marking(m);
        expect(m).toBeTruthy();
        expect(m.get('a')).toBe(1);
        expect(m.get('b')).toBe(0);
    });

    it('should check equality', () => {
        const m1 = new Marking({'a': 0, 'b': 1});
        const m2 = new Marking(m1);
        expect(m1.equals(m2)).toBeTrue();
        expect(m2.equals(m1)).toBeTrue();
        m2.set('a', 1);
        expect(m1.equals(m2)).toBeFalse();
        expect(m2.equals(m1)).toBeFalse();
        m2.set('a', 0);
        expect(m1.equals(m2)).toBeTrue();
        expect(m2.equals(m1)).toBeTrue();
        m2.set('c', Number.POSITIVE_INFINITY);
        expect(m1.equals(m2)).toBeFalse();
        expect(m2.equals(m1)).toBeFalse();
        m1.set('c', Number.POSITIVE_INFINITY);
        expect(m1.equals(m2)).toBeTrue();
        expect(m2.equals(m1)).toBeTrue();
        m2.set('c', 0);
        expect(m1.equals(m2)).toBeFalse();
        expect(m2.equals(m1)).toBeFalse();
    });

    it('should check greaterThan', () => {
        const m1 = new Marking({'a': 0, 'b': 1});
        const m2 = new Marking({'a': 0, 'b': 1});
        expect(m1.isGreaterThan(m2)).toBeFalse();
        expect(m2.isGreaterThan(m1)).toBeFalse();
        m1.set('a', 1);
        expect(m1.isGreaterThan(m2)).toBeTrue();
        expect(m2.isGreaterThan(m1)).toBeFalse();
        m1.set('b', 0);
        expect(m1.isGreaterThan(m2)).toBeFalse();
        expect(m2.isGreaterThan(m1)).toBeFalse();
        m1.set('a', Number.POSITIVE_INFINITY);
        expect(m1.isGreaterThan(m2)).toBeFalse();
        expect(m2.isGreaterThan(m1)).toBeFalse();
        m1.set('b', 1);
        expect(m1.isGreaterThan(m2)).toBeTrue();
        expect(m2.isGreaterThan(m1)).toBeFalse();
        m2.set('a', Number.POSITIVE_INFINITY);
        expect(m1.isGreaterThan(m2)).toBeFalse();
        expect(m2.isGreaterThan(m1)).toBeFalse();
        m1.set('b', Number.POSITIVE_INFINITY);
        expect(m1.isGreaterThan(m2)).toBeTrue();
        expect(m2.isGreaterThan(m1)).toBeFalse();
    });

    it('should introduce omegas', () => {
        const m1 = new Marking({'a': 0, 'b': 1});
        const m2 = new Marking(m1);
        m1.introduceOmegas(m2);
        expect(m1.equals(m2)).toBeTrue();
        m2.set('a', 1);
        m1.introduceOmegas(m2);
        expect(m2.isGreaterThan(m1)).toBeTrue();
        m2.set('b', 0);
        m1.introduceOmegas(m2);
        expect(m1.get('a')).toBe(0);
        expect(m1.get('b')).toBe(1);
        m1.set('a', 1);
        m1.introduceOmegas(m2);
        expect(m1.get('a')).toBe(1);
        expect(m1.get('b')).toBe(Number.POSITIVE_INFINITY);
        m1.set('b', 1);
        m1.set('c', 1);
        m2.set('c', 0);
        m1.introduceOmegas(m2);
        expect(m1.get('a')).toBe(1);
        expect(m1.get('b')).toBe(Number.POSITIVE_INFINITY);
        expect(m1.get('c')).toBe(Number.POSITIVE_INFINITY);
    });
});
