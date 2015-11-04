import app from '../../module'
app.controller('ExampleController', class Controller {
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
})