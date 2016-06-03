/* 简明扼要, 例子清晰，易于实施 */

// ----------------- module部分 -----------------------
// 定义module， 文件名： app.module.js
angular
    .module('app', ['ngRoute']);

// 扩充module， 文件名： logger.js
(function() {
    'use strict';

    angular
        .module('app')
        .factory('logger', logger);

    function logger() { }
})();

/*
# Single Responsibility 单一责任的文件，小函数
 * 小文件， <400LOC （代码行）， 1个组件， 1个文件，
 * Small Functions，小函数 < 75LOC（1屏幕）， 易于重用，维护和测试

# 用IIFE减少全局变量
 * 类和组件， 要包裹在IIFE里面， （立即执行的函数表达式） Immediately Invoked Function Expression .
 * 减少全局变量， 从而缩短变量的寿命，避免重名

# Modules模块定义
 避免产生额外的全局变量：
 用getter + chain减少变量
 * 在定义module的时候， 用chain,不要用setter语法引入中间变量，
 * 在引用module的时候， 用chain + getter语法， 不引入中间变量。
 * 一个module只能创建1次， 多次引用
 * 用有名函数， 不要用匿名callback， 以避免Nested的callback
 */

// ----------------- controller 部分 -----------------------
/* 在view中：
 <div ng-controller="CustomerProductController as ProductVm">
 <input ng-model="ProductVm.title"/>
 </div>
 */

angular
    .module('app')
    .controller('CustomerProductController', CustomerProductController);

CustomerProductController.$inject = ['$scope', 'dataservice', 'logger'];

function CustomerProductController($scope, dataservice, logger) {
    var vm = this;
    vm.refresh = refresh;
    vm.search = search;
    vm.sessions = [];
    vm.title = 'Sessions';

    ////////////
    function refresh() {
    }

    function search() {
    }

    $scope.$watch('vm.title', function(current, original) {
        $log.info('vm.title was %s', original);
        $log.info('vm.title is now %s', current);
    });
}

// route-config.js
angular
    .module('app')
    .config(config);

function config($routeProvider) {
    $routeProvider
        .when('/customerProduct', {
            templateUrl: 'customerProduct.html',
            controller: 'CustomerProductController',
            controllerAs: 'productVm'
        });
}

/*
 Controllers
 * 在controller自身中， 用vm（view Modal）代替this，避免歧义，并减少$scope,（仅仅剩余少数情况下，必须用$scope,例如：$emit, $broadcast, $on, $watch等)
 * 把bindable函数写在前面， 并按照字母排序， 具体的实现放在后面（如果实现只有1行，可以直接写）。从而让重要的函数一览无余， 而且与函数的顺序无关。
 * 用function语法实现函数， 不要用var语法， （因为var 语法的函数必须“先定义后使用”，顺序变化会导致错误。
 * 薄controller， 厚service： 尽量把controller的逻辑下放到services，便于逻辑部分的重用和test
 * 让controller专注到1个view， 不要重用，因为UI经常变，（而让可重用部分下放给service）
 * 在view中直接指定controller： 也用as语法代替$scope， 类似于new一个实例，接近本色的.语法., 避免$parent,
 * 在route中用as语法定义controller和view，而避免在view中直接指定controller（绑死了），这样， 可以灵活地在route中重用view与controller。 （以此代替在view中定义controller）
 */

// ----------------- factory 和 service 部分 -----------------------
// factory
angular
    .module('app')
    .factory('logger', logger);

function logger() {
    return {
        logError: function(msg) {
        }
    };
}

// service， 建议全部改用factory
angular
    .module('app')
    .service('logger', logger);

function logger() {
    this.logError = function(msg) {
    };
}

// 用factory形式写的service
// dataService.js
angular
    .module('app.core')
    .factory('dataService', dataService);

dataService.$inject = ['$http', '$location', '$q', 'exception', 'logger'];

function dataService($http,  $location, $q, exception, logger) {
    var isPrimed = false;
    var primePromise;

    var service = {
        getAvengers: getAvengers,
        ready: ready
    };

    return service;

    ////////////
    function getAvengers() {
        return $http.get('/api/maa')
            .then(getAvengersComplete)
            .catch(getAvengersFailed);

        function getAvengersComplete(response) {
            return response.data.results;
        }

        function getAvengersFailed(error) {
            logger.error('XHR Failed for getAvengers.' + error.data);
        }
    }

    function ready(nextPromises) {
    }
}

/*
 * factory都是singleton， 返回的object包括了其所有接口函数
 * 用factory代替service， 以简化技术，并保持一致性。
   因为，所有的service都是singleton，而且用new来实例化。
 * 用$inject注入依赖的模块， 让minify成功， 对于controller，service，route和directive都适用。
 * 与Controller一样， Factories也需要：任务要单一， 接口函数放在前面，等
 */

// ------ 综合应用（1/2）： 在controller中采用activate形式解决初始值 -----
function AvengersController(dataService, logger) {
    var vm = this;
    vm.avengers = [];

    activate();

    function activate() {
        return dataService.getAvengers()
            .then(function(data) {
                vm.avengers = data;
                return vm.avengers;
            });
    }
}

/*
 * Data操作全部抽出来，放到Service中， 不要放在controller中
 data操作包括：http， local storage， db等等
 * service提供的数据操作接口最好返回promise， 以利于chain操作
 * 在controller中以activate（也就是初始化）的形式调用promise来获得数据，（而不是直接写一堆代码调用） 使得logic集中， 便于在refresh中重用。
 *
 * 区别：
 * * activate方法：必然打开view， 显示快，
 * * route-resolve方法：能够根据promise的reject/resolve其情况来决定是否开启此route（及其view）， 代码零散
 */

// ------ 综合应用（2/2）： 采用在 route中resolve的方法， 解决controller中的初始值 ----
// 文件 route-config.js
function config($routeProvider) {
    $routeProvider
        .when('/avengers', {
            templateUrl: 'avengers.html',
            controller: 'AvengersController',
            controllerAs: 'vm',
            resolve: {
                moviesPrepService: moviesPrepService
            }
        });
}

moviesPrepService.$inject = ['movieService'];
function moviesPrepService(movieService) {
    return movieService.getMovies();
}

// controller.js
angular
    .module('app.avengers')
    .controller('AvengersController', AvengersController);

AvengersController.$inject = ['moviesPrepService'];
function AvengersController(moviesPrepService) {
    var vm = this;
    vm.movies = moviesPrepService.movies;
}

/*
 Manual Annotating for Dependency Injection: 手工注入， 让minify安全
 */

/*
 其余主题：
 Minification and Annotation: 注释，适合minify的
 Exception Handling
 */

/* Naming: 命名规范
 feature.type.js
 */