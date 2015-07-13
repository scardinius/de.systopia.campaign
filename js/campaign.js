(function(angular, $, _) {
   var resourceUrl = CRM.resourceUrls['de.systopia.campaign'];
   var campaign = angular.module('campaign', ['ngRoute', 'crmUtil', 'crmUi', 'crmD3']);

   campaign.config(['$routeProvider',
     function($routeProvider) {
      $routeProvider.when('/campaign', {
         templateUrl: resourceUrl + '/partials/dashboard.html',
         controller: 'DashboardCtrl'
      });

      $routeProvider.when('/campaign/:id/view', {
         templateUrl: resourceUrl + '/partials/campaign_dashboard.html',
         controller: 'CampaignDashboardCtrl',
         resolve: {
          currentCampaign: function($route, crmApi) {
            return crmApi('Campaign', 'getsingle', {id: $route.current.params.id});
          },
          children: function($route, crmApi) {
             return crmApi('CampaignTree', 'getids', {id: $route.current.params.id, depth: 1});
          },
          parents: function($route, crmApi) {
             return crmApi('CampaignTree', 'getparentids', {id: $route.current.params.id});
          },
          kpi: function($route, crmApi) {
             return crmApi('CampaignKpi', 'get', {id: $route.current.params.id});
          },
          expenseSum: function($route, crmApi) {
             return crmApi('CampaignExpense', 'getsum', {campaign_id: $route.current.params.id});
          },
          expenses: function($route, crmApi) {
             return crmApi('CampaignExpense', 'get', {campaign_id: $route.current.params.id});
          }
        }
      });

      $routeProvider.when('/campaign/:id/tree', {
        templateUrl: resourceUrl + '/partials/campaign_tree.html',
        controller: 'CampaignTreeCtrl',
        resolve: {
          tree: function($route, crmApi) {
           return crmApi('CampaignTree', 'gettree', {id: $route.current.params.id, depth: 10});
         },
         currentCampaign: function($route, crmApi) {
           return crmApi('Campaign', 'getsingle', {id: $route.current.params.id});
        },
        parents: function($route, crmApi) {
          return crmApi('CampaignTree', 'getparentids', {id: $route.current.params.id});
        },
        }
      });

      $routeProvider.when('/campaign/:id/expense/add', {
        templateUrl: resourceUrl + '/partials/campaign_expense.html',
        controller: 'CampaignExpenseCtrl'
      });

  }]);

   campaign.controller('DashboardCtrl', ['$scope', '$routeParams', function($scope, $routeParams) {
    $scope.ts = CRM.ts('de.systopia.campaign');

  }]);

  campaign.controller('CampaignDashboardCtrl', ['$scope', '$routeParams',
  '$sce',
  'currentCampaign',
  'children',
  'parents',
  'kpi',
  'expenseSum',
  'expenses',
  'crmApi',
  'dialogService',
  '$interval',
   function($scope, $routeParams, $sce, currentCampaign, children, parents, kpi, expenseSum, expenses, crmApi, dialogService, $interval) {
     $scope.ts = CRM.ts('de.systopia.campaign');
     $scope.currentCampaign = currentCampaign;
     $scope.currentCampaign.goal_general_htmlSafe = $sce.trustAsHtml($scope.currentCampaign.goal_general);
     $scope.currentCampaign.start_date_date = $.datepicker.formatDate(CRM.config.dateInputFormat, new Date($scope.currentCampaign.start_date));
     $scope.currentCampaign.end_date_date = $.datepicker.formatDate(CRM.config.dateInputFormat, new Date($scope.currentCampaign.end_date));
     $scope.children = children.children;
     $scope.kpi = JSON.parse(kpi.result);
     $scope.parents = parents.parents.reverse();
     $scope.expenseSum = expenseSum.values;
     $scope.expenses = expenses.values;
     console.log($scope.kpi);
     console.log($scope.expenses);
     $scope.numberof = {
        parents: Object.keys($scope.parents).length,
        children: Object.keys($scope.children).length,
        };
     $scope.tree_link = CRM.url('civicrm/a/#/campaign/' + $scope.currentCampaign.id + '/tree', {});
     $scope.subcampaign_link = CRM.url('civicrm/campaign/add', {reset: 1, pid: $scope.currentCampaign.id});
     $scope.edit_link = CRM.url('civicrm/campaign/add', {reset: 1, id: $scope.currentCampaign.id, action: 'update'});
     $scope.add_link = CRM.url('civicrm/a/#/campaign/' + $scope.currentCampaign.id + '/expense/add', {});

     $scope.updateKpiAndExpenses = function() {
       crmApi('CampaignExpense', 'get', {campaign_id: $scope.currentCampaign.id}).then(function (apiResult) {
         $scope.expenses = apiResult.values;
       }, function(apiResult) {
         CRM.alert(apiResult.error_message, "Error while fetching expenses", "error");
       });
       crmApi('CampaignKpi', 'get', {id: $scope.currentCampaign.id}).then(function (apiResult) {
         $scope.kpi = JSON.parse(apiResult.result);
       }, function(apiResult) {
         CRM.alert(apiResult.error_message, "Error while fetching expenses", "error");
       });
     }

     $scope.deleteExpense = function(expense) {
       crmApi('CampaignExpense', 'delete', {id: expense.id}).then(function (apiResult) {
         $scope.updateKpiAndExpenses();
         CRM.alert("Successfully removed expense \"" + expense.description + "\"", "Expense deleted", "success");
       }, function(apiResult) {
         CRM.alert(apiResult.error_message, "Could not delete expense", "error");
       });
     }

     $scope.addExpense = function() {
       var model = {
         campaign_id: $scope.currentCampaign.id,
        };
        var options = CRM.utils.adjustDialogDefaults({
          width: '40%',
          height: 'auto',
          autoOpen: false,
          title: ts('Add Expense')
        });
        dialogService.open('addExpenseDialog', resourceUrl + '/partials/campaign_expense.html', model, options).then(function (result) {
          $scope.updateKpiAndExpenses();
        });
     }

     $scope.editExpense = function(exp) {
       console.log(exp);
       var model = {
         campaign_id: $scope.currentCampaign.id,
         amount: exp.amount,
         description: exp.description,
         contact_id: exp.contact_id,
         transaction_date: exp.transaction_date,
         id: exp.id
        };
        var options = CRM.utils.adjustDialogDefaults({
          width: '40%',
          height: 'auto',
          autoOpen: false,
          title: ts('Add Expense')
        });
        dialogService.open('addExpenseDialog', resourceUrl + '/partials/campaign_expense.html', model, options).then(function (result) {
          $scope.updateKpiAndExpenses();
        });
     }


  }]);

  campaign.controller('CampaignExpenseCtrl', ['$scope', '$routeParams', 'crmApi', 'dialogService',
  function($scope, $routeParams, crmApi, dialogService) {
    $scope.ts = CRM.ts('de.systopia.campaign');
    $scope.submit = function() {
      if($scope.addExpenseForm.$invalid) {
        return;
      }
      crmApi('CampaignExpense', 'create', $scope.model).then(function (apiResult) {
        var expense = apiResult.values[apiResult.id];
        CRM.alert("Successfully added expense \"" + expense.description + "\"", "Expense added", "success");
        dialogService.close('addExpenseDialog', expense);
      }, function(apiResult) {
        CRM.alert(apiResult.error_message, "Could not add expense", "error");
      });
    }
  }]);

  campaign.controller('CampaignTreeCtrl', ['$scope', '$routeParams',
   'tree',
   'currentCampaign',
   'parents',
   function($scope, $routeParams, tree, currentCampaign, parents) {
    $scope.ts = CRM.ts('de.systopia.campaign');

    $scope.current_campaign = currentCampaign;
    $scope.current_tree = JSON.parse(tree.result)[0];
    $scope.parents = parents;

    $scope.campaign_link = CRM.url('civicrm/a/#/campaign/' + $scope.current_campaign.id + '/view', {});
    $scope.parent_link = CRM.url('civicrm/a/#/campaign/' + $scope.current_campaign.parent_id + '/tree', {});
    $scope.root_link = CRM.url('civicrm/a/#/campaign/' + $scope.parents.root + '/tree', {});
  }]);

  campaign.directive("campaignTree", function($window) {
    return{
      restrict: "EA",
      template: "<svg width='850' height='200'></svg>",
      link: function(scope, elem, attrs){
        var treeData=scope[attrs.treeData];

        var margin = {top: 100, right: 50, bottom: 100, left: 50},
        width  = 960 - margin.left - margin.right,
        height = 500 - margin.top  - margin.bottom;

        var center = [width / 2, height / 2];

        var d3 = $window.d3;
        var rawSvg = elem.find("svg")[0];

        var svg = d3.select(rawSvg)
        .attr("style", "outline: thin dashed black;")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("class","drawarea")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

         var x = d3.scale.linear()
             .domain([-width / 2, width / 2])
             .range([0, width]);

         var y = d3.scale.linear()
             .domain([-height / 2, height / 2])
             .range([height, 0]);

         var zoom = d3.behavior.zoom()
              .x(x)
              .y(y)
              .center(center)
              .scaleExtent([0.5, 5])
              .on("zoom", zoomed);

         var selectedNode = null;

         var drag = d3.behavior.drag()
         .on("dragstart", function(c) {
            selectedNode = c;
            console.log(c);
            d3.event.sourceEvent.stopPropagation();
         })
         .on("drag", function(d) {
            var nodes = tree.nodes(d);

            console.log(d3.event);

            nodes.forEach(function(k) {
               var currentNode = d3.select('#node_' + k.id);
              //  var t = d3.transform(currentNode.attr("transform"));
              //  var nt = { 'x': t.translate[0] + d3.event.x,
              //             'y': t.translate[1] + d3.event.y };

              //  if(k.x0 == undefined) {
              //    k.x0 = k.x;
              //  }
              //  if(k.y0 == undefined) {
              //    k.y0 = k.y;
              //  }

               //k.x += d3.event.x;
               //k.y += d3.event.y;



               currentNode.select("circle").style("stroke", "red");
            });

            var parentLink = d3.select('#p_' + d.parentid + '_' + d.id);
            parentLink.style("stroke", "red");

            update();
         })
         .on("dragend", function(c) {
            d3.selectAll(".node").select("circle").style("stroke", null) ;

            var parentLink = d3.select('#p_' + c.parentid + '_' + c.id);
            parentLink.style("stroke", null);

            var xdist = c.x - c.x0;
            var ydist = c.y - c.y0;
            var distance = Math.sqrt((xdist*xdist)+(ydist*ydist));
            console.log(distance);

            // if(distance < 100.0) {
            //   var nodes = tree.nodes(c);
            //   nodes.forEach(function(k) {
            //     k.x = k.x0;
            //     k.y = k.y0;
            //   });
            //   update();
            // }

            selectedNode = null;
         });


        d3.select("svg")
        .call(zoom);

        var resetBtn = d3.select("#tree_container #resetBtn");
        resetBtn.on("click", reset);
      //   var zoomInBtn = d3.select("#tree_container #zoomInBtn");
      //   zoomInBtn.on("click", zoomIn);

        var i = 0;

        var tree = d3.layout.tree()
        	.size([width, height]);

        var diagonal = d3.svg.diagonal()
          .source(function(d) { return {"x":d.source.x, "y":d.source.y}; })
          .target(function(d) { return {"x":d.target.x, "y":d.target.y}; })
        	.projection(function(d) { return [d.x, d.y]; });

        root = treeData;
        var nodes;

        function zoomed() {
             var scale = d3.event.scale,
                 translation = d3.event.translate,
                 tbound = -height * scale,
                 bbound = height * scale,
                 lbound = (-width + margin.right) * scale,
                 rbound = (width - margin.left) * scale;

             translation = [
                 Math.max(Math.min(translation[0], rbound), lbound),
                 Math.max(Math.min(translation[1], bbound), tbound)
             ];
             d3.select(".drawarea")
                 .attr("transform", "translate(" + translation + ")" +
                       " scale(" + scale + ")");
        }

        function reset() {
           svg.call(zoom
               .x(x.domain([-width / 2, width / 2]))
               .y(y.domain([-height / 2, height / 2]))
               .event);
           init();
           update();
        }

        function createCampaignLink(d) { return CRM.url('civicrm/a/#/campaign/' + d.id + '/tree', {}); }

        function init() {
          nodes = tree.nodes(root).reverse();
          nodes.forEach(function(d) { d.y = d.depth * 100; });
          console.log("nodes", nodes);
        }

        function update(source) {
          links = tree.links(nodes);

          var node = svg.selectAll("g.node")
        	  .data(nodes, function(d) { return d.id || (d.id = ++i); });

          node.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")"; });

          var nodeEnter = node.enter().append("g")
        	  .attr("class", "node")
            .attr("id", function(d) {return "node_" + d.id;})
        	  .attr("transform", function(d) {
        		  return "translate(" + d.x + "," + d.y + ")"; });

          nodeEnter.append("a")
           .attr("xlink:href", createCampaignLink)
           .append("circle")
        	   .attr("r", 15)
        	   .style("fill", "#fff")
             .call(drag);

          nodeEnter.append("a")
          .attr("xlink:href", createCampaignLink)
          .append("text")
        	  .attr("y", function(d) {
        		  return d.children || d._children ? -23 : 23; })
        	  .attr("dy", ".40em")
        	  .attr("text-anchor", "middle")
        	  .text(function(d) { return d.name; })
        	  .style("fill-opacity", 1);

          var link = svg.selectAll("path.link")
        	  .data(links, function(d) { return d.target.id; });

          link.attr("d", diagonal);

          link.enter().insert("path", "g")
        	  .attr("class", "link")
            .style("stroke", "#aaa")
            .attr("id", function(d) { return "p_" + d.source.id + "_" + d.target.id;})
        	  .attr("d", diagonal);

          link.exit().remove();
        }

        init();
        update(root);
      }
    };
  });

})(angular, CRM.$, CRM._);
