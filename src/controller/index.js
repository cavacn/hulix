import example from './example'

import app from '../module'

app.config(/*@ngInject*/function ($stateProvider, $urlRouterProvider) {
        // For unmatched routes
        $urlRouterProvider.otherwise('/');

        // Application routes
        $stateProvider
            .state('example', /*@ngInject*/{
                url: example.url,
                abstract: example.abstract,
                template: example.template,
                controller: example.controller
            })
    }
)