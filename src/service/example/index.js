import app from '../../module'
class Example {

    // @ngInject
    constructor($q) {
        this.$q = $q
    }

    slogan() {
        let defer = this.$q.defer()
        defer.resolve('Hail Hydra')
        return defer.promise
    }

}


app.service('example', Example)