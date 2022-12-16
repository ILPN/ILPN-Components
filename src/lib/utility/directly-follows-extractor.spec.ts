import {DirectlyFollowsExtractor} from './directly-follows-extractor';


describe('DirectlyFollowsExtractor', () => {
    it('should extract one-way directly follows pairs', () => {
        const extractor = new DirectlyFollowsExtractor();
        expect(extractor).toBeTruthy();

        extractor.add('b', 'a');
        extractor.add('a', 'b');
        extractor.add('c', 'a');
        extractor.add('d', 'c');
        extractor.add('c', 'd');
        extractor.add('e', 'c');
        extractor.add('e', 'd');

        const oneWay = extractor.oneWayDirectlyFollows();
        expect(oneWay).toBeTruthy();
        expect(oneWay.length).toBe(3);
        expect(oneWay.some(([f, s]) => f === 'a' && s === 'c')).toBeTrue();
        expect(oneWay.some(([f, s]) => f === 'c' && s === 'e')).toBeTrue();
        expect(oneWay.some(([f, s]) => f === 'd' && s === 'e')).toBeTrue();
    });
});
