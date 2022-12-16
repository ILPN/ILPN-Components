import {DirectlyFollowsExtractor} from './directly-follows-extractor';


describe('DirectlyFollowsExtractor', () => {
    it('should extract one-way directly follows pairs', () => {
        const extractor = new DirectlyFollowsExtractor();

        expect('tests').toBe('written');
    });
});
