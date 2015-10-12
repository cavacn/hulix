import html from './index.html'
import './index.less'
import app from '../../module'
app.directive('directiveExample', directive)
function directive() {
    return {
        restrict: 'E',
        template: html,
        transclude: false,
        scope: {
            slogan: '='
        },
        link: (scope, element, attr) => {
            // link
        },

        controller: /*@ngInject*/ ($scope) => {
            // controller
        }
    }
}