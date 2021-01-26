

describe('df', () => {
    it('should do', () => {
        const questionList = new QuestionList('ql1');
        questionList.addSite('s1', 'Paris');
        questionList.addQuestion('q1', 'Number of consultations');
        questionList.addDisagregation('q1', 'd1', 'Age');
        questionList.addDisagregationElement('q1', 'd1', 'de1', 'Under 12');
        questionList.addDisagregationElement('q1', 'd1', 'de2', '12 and more');

        

    })
})