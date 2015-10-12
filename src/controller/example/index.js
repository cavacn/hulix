import html from './index.html'

export default {
    url: '',
    template: html,
    abstract: false,
    controller: class Controller {
        // @ngInject
        constructor($scope, example) {
            $scope.vm = this
            this.$scope = $scope
            this.example = example
            $scope.slogan = '***'
        }

        shutOut() {
            this.example.slogan()
                .then((text) => {
                    this.$scope.slogan = text
                })
        }

    }
}
