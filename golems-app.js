angular.module('golems', ['api', 'ngCsv', 'ngCookies']).
  config(function($routeProvider) {
    $routeProvider.
      when('/', { controller: Card, templateUrl: 'card.html' }).
      otherwise({redirectTo:'/'});
  }).filter('fromNow', function() {
    return function(maybeDate) {
      if (typeof(maybeDate) === "string" && maybeDate.match(/^20[12][0-9]-.*Z$/)) {
        var d = Date.parse(maybeDate);
        return isNaN(d) ? maybeDate: moment(d).from(moment(Math.max(d, Date.now()))); // if server is ahead of us use its time
      } else {
        return maybeDate;
      }
    };
  }).filter('title', function() {
    return function(s) {
      return s.replace(/[-_]/g, ' ').replace(/([^A-Z ])([A-Z])/g, '$1 $2');
    };
  }).filter('filename', function() {
    return function(s) {
      return s.toLowerCase().split(' ').join('_');
    };
  }).filter('uri', function() {
    return function(s) {
      return encodeURIComponent(s);
    };
  }).filter('querystring', function() {
    return function(p) {
      return Object.keys(p).map(function (key) { return [key, p[key]].map(encodeURIComponent).join('='); }).join('&'); 
    };
  }).filter('bits', function() {
    return function(hex, l) {
      return parseInt(hex, 16).toString(2).substr(0, l);
    };
  }).config(function($httpProvider){
    delete $httpProvider.defaults.headers.common['X-Requested-With']; // borks CORS 
  });

function isAdmin(username) {
  // consider any non group alias admin worthy for now
  return ["engineering@snupi.com", "marketing@snupi.com"].indexOf(username) == -1;
}

function  sorter($scope, $location) {
  return function (column) {
    if (column == $scope.orderBy) {
      $scope.orderBy = '-' + column;
    } else {
      $scope.orderBy = column;
    }
    $location.search({ orderBy: $scope.orderBy });
  }
}

// cloned from GatewaySpy.js
function loggerTypeFormat (r) {
        switch (r) {
            case "1": return "Valid";
            case "2": return "BadCrc";
            case "3": return "NoBarker";
            case "4": return "Background";
            case "5": return "Gateway Status";
        }
        return "null";
};

function Card($scope, $location, Person) {
  $scope.debug = true; // "debug" in $location.search();
  $scope.golem = Person.get({ spore: "random" });
}

function ListEvents($scope, $routeParams, $location, $timeout, Event) {

  $scope.q = {
    sort: "-time",
    limit: $location.search().limit || 32,
  };
  if ($location.search().type) $scope.q.type = $location.search().type;
  if ($location.search().gateway) $scope.q.gateway = $location.search().gateway;

  $scope.refresh = $location.search().refresh || 10

  var payloadColumns = {
    LINK: [ "HW_TYPE", "MSG_SPEC", "MAN_YEAR", "MAN_WEEK", "MAN_ID", "HW_REV", "FW_REV", "CNT" ],
    SENSOR: [ "TEMP", "RH", "COND" ]
  }

  $scope.title = "Last " + $scope.q.limit + ($scope.q.type ? " " + $scope.q.type : "") + " events";
  $scope.columns = [ "time", "type" ];
  if ($scope.q.type && $scope.q.type in payloadColumns) {
    $scope.groups = { payload: payloadColumns[$scope.q.type].length };
    $scope.groupColumns = payloadColumns[$scope.q.type].map(function (a) { return ["payload", a].join('.'); });
  } else {
    $scope.columns.push('payload');
  }
  $scope.spouses = [ { "snid": "devices" } ];
  $scope.orderBy = $location.search.orderBy || "-time";

  if ($scope.q.gateway) {
    $scope.title += " through gateway " + $scope.q.gateway;
  } else {
    $scope.spouses.push({ "gateway": "gateways" });
  }

  $scope.sort = sorter($scope, $location);

  $scope.rows = Event.query($scope.q, function tick() {
      var tmp = Event.query($scope.q, function () { $scope.rows = tmp; $timeout(tick, $scope.refresh * 1000); });
    }
  );

  $scope.debug = "debug" in $location.search();
}

function QueryEvents($scope, $location)
{
  $scope.q = $location.search();
  if (!$scope.q.from) $scope.q.from = moment().subtract("1d");
  else $scope.q.from = moment($scope.q.from).toISOString();
  if ($scope.q.to) $scope.q.to = moment($scope.q.to).toISOString();

  $scope.debug = "debug" in $location.search();
}

function ListDatalogs($scope, $routeParams, $location, $timeout, Datalog) {

  $scope.q = {
    sort: "-time",
    limit: $location.search().limit || 32
  };
  if ($location.search().contentType) {
    $scope.q["metadata.contentType"] = $location.search().contentType;
  }
  $scope.refresh = $location.search().refresh || 15

  var metadataColumns = {
    "1": ["sampleNum", "decoderVersion", "RssiPeakRatio", "RawMean", "NoiseVolts", "RawDeviation", "RssiPeakValue", "SnrVolts", "NoiseDeviationVolts", "RawDeviationRatio", "SignalVolts"],
    "2": ["sampleNum", "decoderVersion", "SignalVolts", "SnrVolts", "NoiseVolts", "NoiseDeviationVolts", "RawDeviationRatio", "RssiPeakValue", "RssiPeakRatio", "RawMean", "RawDeviation" ],
    "3": ["sampleNum", "decoderVersion", "SignalVolts", "SnrVolts", "NoiseVolts", "NoiseDeviationVolts", "RawDeviationRatio", "RssiPeakValue", "RssiPeakRatio", "RawMean", "RawDeviation" ],
    "4": ["sampleNum", "decoderVersion", "SignalVolts", "SnrVolts", "NoiseVolts", "NoiseDeviationVolts", "RawDeviationRatio", "RssiPeakValue", "RssiPeakRatio", "RawMean", "RawDeviation" ],
    "5": ["sampleNum", "DecoderVersion", "SystemUptime", "SampleBuffersProcessed", "PacketsDetected", "PacketsValid", "EventsUploaded" ]
  };

  $scope.title = "Recent " + ($scope.q["metadata.contentType"] ? loggerTypeFormat($scope.q["metadata.contentType"]) : "") + " data logs";
  $scope.headers = { "snid": "gateway" };
  $scope.columns = [ "time" ];
  if ($scope.q["metadata.contentType"] && $scope.q["metadata.contentType"] in metadataColumns) {
    $scope.groups = { metadata: metadataColumns[$scope.q["metadata.contentType"]].length };
    $scope.groupColumns = metadataColumns[$scope.q["metadata.contentType"]].map(function (a) { return ["metadata", a].join('.'); });
  } else {
    $scope.groups = { metadata: 3 };
    $scope.groupColumns = [ "metadata.contentType", "metadata.sampleNum", "metadata.decoderVersion", "metadata.DecoderVersion" ];
  }
  $scope.spouses = [ { "snid": "gateways" } ];
  $scope.linkFrom = 'time';
  $scope.linkTo = '/datalogs/view';
  $scope.linkId = 'id';

  $scope.orderBy = $location.search.orderBy || "-time";
  $scope.sort = sorter($scope, $location);
  $scope.rows = Datalog.query($scope.q, function tick() {
      var tmp = Datalog.query($scope.q, function () { $scope.rows = tmp; $timeout(tick, $scope.refresh * 1000); });
    }
  );

  $scope.debug = "debug" in $location.search();
}

function ViewDatalog($scope, $routeParams, $location, Datalog, Event) {
  $scope.datalog = Datalog.get($routeParams, function (datalog) {
    if (datalog.sampleBufferUrl) {
      var samplePlotter = new DLP.SamplePlotter({ $fmPlotHolder: $("#plot") });
      var downloadSamples = new DLP.DownloadSamples(datalog.sampleBufferUrl, samplePlotter);
      downloadSamples.download();
    }
    // if it's a valid packet look for an event it might have been
    if (datalog.metadata.contentType == 1) {
      var t = Date.parse(datalog.time);
      var q = { 
        from: (new Date(t - 2000)).toISOString(),
        to: (new Date(t + 2000)).toISOString(),
        gateway: datalog.snid
      }
console.log(q);
      $scope.events = Event.query(q);
    }
  });

  $scope.debug = "debug" in $location.search();
}
 
function ListClients($scope, $routeParams, $location, $timeout, Client) {

  var columnsByType = {
    apns:  ['label', 'token', 'system', 'hw', 'app', 'device', 'updated'],
    email: ['label', 'token', 'updated'],
    sms:   ['label', 'token', 'updated']
  };

  $scope.title = $routeParams.clientType + " Clients";
  $scope.columns = columnsByType[$routeParams.clientType];
  $scope.orderBy = $location.search().orderBy || $scope.columns[0];
  $scope.rows = Client.query({ clientType: $routeParams.clientType });
  $scope.linkFrom = 'label';
  $scope.linkTo = '/clients/view';
  $scope.linkId = 'clientId';

  $scope.sort = sorter($scope, $location);
}

function ViewClient($scope, $routeParams, $location, $timeout, Client) {
  $scope.client = Client.get({clientId: $routeParams.clientId });
}
 
function ListAccounts($scope, $location, $timeout, Account, Event) {

  $scope.columns = [ "updated", "email", "fullName", "address", "phone" ];
  $scope.linkFrom = 'email';
  $scope.linkTo = '/accounts/view';
  $scope.linkId = 'email';

  $scope.orderBy = $location.search().orderBy || "-updated";
  $location.search({ orderBy: $scope.orderBy, from: $scope.from });

  $scope.title = "Accounts";
  
  $scope.rows = Account.query();

  $scope.sort = sorter($scope, $location);
}

function ViewAccount($scope, $location, $routeParams, Account, Device, Gateway, $cookies) {

  function refresh() {
    $scope.account = Account.get({email: $routeParams.email }, function (account) {
      $scope.gateways = Account.gateways({ email: account.email });
      $scope.clients = Account.clients({ email: account.email });
      $scope.devices = Account.devices({ email: account.email }, function (devices) {
        $scope.devices.forEach(function (device) {
          device.active = Math.round(moment().diff(moment(device.updated)) / 1000) <= 15 * 60;
        });
      });
    });
  }

  refresh();

  if ($scope.admin = isAdmin($cookies.username)) {
    $scope.unpair = function (device) {
      if (confirm("Are you certain you want to unpair sensor " + device.snid + " from this account?  This operation cannot be undone.")) {
        device.label = "It hurts, oh how it hurts!";
        Device.unpair(device, refresh);
      }
    };

    $scope.unpairAll = function (devices) {
      if (confirm("Are you certain you want to unpair all sensors from this account?  This operation cannot be undone.")) {
        devices.forEach(function (device, i, a) { Device.unpair(device, (i >= a.length - 1) ? refresh : undefined); });
      }
    }

    $scope.unpairGateway = function (gateway) {
      if (confirm("Are you certain you want to unpair gateway " + gateway.snid + " form this account?  This operation cannot be undone.")) {
        Gateway.unpair(gateway, refresh);
      }
    };
  }

  $scope.debug = "debug" in $location.search();
}
 
function ListGateways($scope, $location, Gateway, IpAddress) {

  $scope.title = "Gateways";
  $scope.columns = [ "snid", "updated" ];
  $scope.spouses = [ { "account": "accounts" } ];
  $scope.flags = [ "active", "lan" ];
  $scope.linkFrom = 'snid';
  $scope.linkId = 'snid';
  $scope.linkTo = '/gateways/view';
  $scope.orderBy = $location.search().orderBy || "-updated";
  $location.search({ orderBy: $scope.orderBy });

  $scope.ipAddress = IpAddress.get();

  $scope.rows = Gateway.query(function (gateways) {
      $scope.rows.forEach(function (gateway) {
        gateway.active = Math.round(moment().diff(moment(gateway.updated)) / 1000) <= 11 * 60;
        gateway.lan = gateway.lastIpAddress === $scope.ipAddress.query || null;
      });
  });

  $scope.sort = sorter($scope, $location);
}
 
function ViewGateway($scope, $route, $routeParams, $location, $timeout, Gateway, Event, IpAddress, Datalog, $cookies) {

  $scope.debug = "debug" in $location.search();

  var limit = $location.search().limit || 16;
  var refresh = $location.search().refresh || 30; 

  $scope.paired_state = "unknown...";
  $scope.gateway = Gateway.get($routeParams, function (gateway) {
    if (!("account" in gateway)) {
      $scope.paired_state = "not paired";
    } else if (gateway.account === "") {
      $scope.paired_state = "<strong class=\"text-error\">WARNING! account is blank, pairing attempts wil fail.</strong>";
    } else {
      $scope.paired_state = "paired";
    }

    // look for status once a minute
    $timeout(function () {
      Datalog.query({ snid: gateway.snid, limit: limit, sort: "-time" }, function (datalogs) {
        $scope.status = datalogs.filter(function (datalog) { return !datalog.sampleBufferUrl; }).shift();
        $scope.samples = datalogs.filter(function (datalog) { return !!datalog.sampleBufferUrl; });
      }, 60 * 1000);
    });
    if (gateway.lastIpAddress) {
      IpAddress.get(function (current) {
        $scope.lan = gateway.lastIpAddress === current.query;
        if ($scope.lan) {
          $scope.ipAddress = current;
        } else {
          $scope.ipAddress = IpAddress.get({ipAddress: gateway.lastIpAddress });
        }
      });
    }
      
    $scope.events = Event.query({gateway: gateway.snid, sort: "-time", limit: limit },
      function tick() {
        var tmp = Event.query({gateway: gateway.snid, sort: "-time", limit: limit },
          function () { $scope.events = tmp; $timeout(tick, refresh * 1000); }
        );
      }
    );
  });

  if ($scope.admin = isAdmin($cookies.username)) {
    $scope.unpair = function (gateway) {
      if (confirm("Are you certain you want to unpair this gateway from " + gateway.account + "?  This operation cannot be undone.")) {
        Gateway.unpair(gateway, function () { $route.reload(); });
      }
    };
  }

  // cloned from GatewaySpy
  $scope.statusTableDef = [
        {
            name: "Infrastructure",
            fields: [
                { title: "Decoder Uptime Hours", fieldName: "UptimeHours" },
                { title: "Samples Read", fieldName: "SamplesRead" },
                { title: "Sample Buffers Processed", fieldName: "SampleBuffersProcessed" },
                { title: "System Uptime Seconds", fieldName: "SystemUptime" },
                { title: "Config Locked", fieldName: "LockConfig" },
                { title: "Firmware Locked", fieldName: "LockFirmware" }
            ],
        },
        {
            name: "Decoder",
            fields: [
                { title: "Packets Detected", fieldName: "PacketsDetected" },
                { title: "Packets Valid", fieldName: "PacketsValid" },
                { title: "Detector Pipe Overflows", fieldName: "DetectorPipelineOverflows" },
                { title: "Decoder Pipe Overflows", fieldName: "DecoderPipelineOverflows" },
                { title: "Receiver Pipe Overflows", fieldName: "UploadToReceiverPipelineOverflows" },
                { title: "DataLogger Pipe Overflows", fieldName: "UploadToDataLoggerPipelineOverflows" }
            ],
        },
        {
            name: "Cloud",
            fields: [
                { title: "Events Uploaded", fieldName: "EventsUploaded" },
                { title: "Loggers Uploaded", fieldName: "LoggersUploaded" },
                { title: "Statuses Uploaded", fieldName: "StatusesUploaded" },
                { title: "Event Upload Errors", fieldName: "UploadEventErrors" },
                { title: "Logger Upload Errors", fieldName: "UploadLoggerErrors" },
                { title: "Event Upload Exceptions", fieldName: "UploadEventExceptions" },
                { title: "Logger Upload Exceptions", fieldName: "UploadLoggerExceptions" }
            ],
        },
        {
            name: "Configuration",
            fields: [
                { title: "Decoder Version", fieldName: "DecoderVersion" },
                { title: "Firmware Version", fieldName: "FirmwareVersion" },
                { title: "Params Crc", fieldName: "ParamsCrc" },
                { title: "Config Overridden", fieldName: "ConfigOverridden" },
                { title: "Rssi Threshold Ratio", fieldName: "RssiThreshold" },
                { title: "Barker Threshold Ratio", fieldName: "BarkerThreshold" },
                { title: "Status Interval Secs", fieldName: "UploadGatewayStatusIntervalSecs" }
            ],
        }
    ];

    $scope.loggerTypeFormat = loggerTypeFormat;
}

function ListDevices($scope, $location, Device) {

  $scope.title = "Devices";
  $scope.columns = [ "snid", "updated", "label", "alarmed" ];
  $scope.flags = [ "active" ];
  $scope.groups = { "location": 3 };
  $scope.groupColumns = [ "location.floor", "location.room", "location.appliance" ];
  $scope.spouses = [ { "account": "accounts" } ];
  $scope.linkFrom = 'snid';
  $scope.linkId = 'snid';
  $scope.linkTo = '/devices/view';
  $scope.orderBy = $location.search().orderBy || $scope.columns[0];

  $scope.rows = Device.query(function () {
    $scope.rows.forEach(function (device) {
      device.active = Math.round(moment().diff(moment(device.updated)) / 1000) <= 11 * 60;
    });
  });

  $scope.sort = sorter($scope, $location);
}
 
function ViewDevice($scope, $routeParams, $location, $timeout, Device, Event, Reservation) {

  $scope.debug = "debug" in $location.search();

  var limit = $location.search().limit || 16;
  var refresh = $location.search().refresh || 30; 

  $scope.device = Device.get($routeParams, function (device) {
    $scope.active = Math.round(moment().diff(moment(device.updated)) / 1000) <= 11 * 60;
    $scope.reservation = Reservation.forDevice({ id: device.snid });
    $scope.events = Event.query({snid: device.snid, sort: "-time", limit: limit },
      function tick() { // poll server for data every 30 seconds
        var tmp = Event.query({snid: device.snid, sort: "-time", limit: limit },
          function () { $scope.events = tmp; $timeout(tick, refresh * 1000); }
        );
      }
    );
  });
}

function ListSessions($scope, $location, Session) {

  $scope.debug = "debug" in $location.search();

  $scope.columns = [ "likeable", "id", "started", "ipAddress" ];
  $scope.safe = { "likeable": true };
  $scope.spouses = [ { "email": "accounts" }, { "clientId": "clients" }, { "gateway": "gateways" } ];
  $scope.linkFrom = 'id';
  $scope.linkId = 'id';
  $scope.linkTo = '/sessions/view';
  $scope.orderBy = $location.search().orderBy || $scope.columns[0];

  $scope.rows = Session.query(function () {
    $scope.rows.forEach(function (session) {
      if (session.gateway) session.likeable = '<a href="http://www.randomkittengenerator.com/" class="btn btn-primary">Like <i class="fa fa-thumbs-up"></i></a>';
    });
  });

  $scope.sort = sorter($scope, $location);
}

function ListPresses($scope, $location, Press) {
  $scope.headers = { "count": "event count" };
  $scope.columns = [ "at", "count" ];
  $scope.spouses = [ { "snid": "devices" } ];
  $scope.orderBy = $location.search().orderBy || $scope.columns[0];
  $scope.rows = Press.query();
  $scope.sort = sorter($scope, $location);
}

/*
function EditCtrl($scope, $location, $routeParams, Client) {
  var self = this;
 
  Client.get({id: $routeParams.clientId}, function(client) {
    self.original = client;
    $scope.client = new Client(self.original);
  });
 
  $scope.isClean = function() {
    return angular.equals(self.original, $scope.client);
  }
 
  $scope.destroy = function() {
    self.original.destroy(function() {
      $location.path('/list');
    });
  };
 
  $scope.save = function() {
    $scope.client.update(function() {
      $location.path('/');
    });
  };
}
*/

// from DataLogger.html TODO: turn this into a module

var DLP = {
};

// DLP.DownloadSamples
(function () {
    DLP.DownloadSamples = DownloadSamples;
    function DownloadSamples(fileStr, plotter) {

        var oReq = new XMLHttpRequest();

        var url = fileStr;

        oReq.open("GET", url, true);
        oReq.responseType = "blob";

        oReq.onload = function (oEvent) {
            var blob = oReq.response; // Note: not oReq.responseText
            if (blob) {
                var reader = new FileReader();
                reader.addEventListener('loadend', function () {
                    var arrayBuffer = reader.result;
                    var bytes = new Uint8Array(arrayBuffer);
                    plotter.plotBytes(bytes);
                });
                reader.readAsArrayBuffer(blob);
            }
        };

        oReq.onerror = function (error, one, two) {
            var res = oReq.response;
            var resBody = oReq.responseBody;
            var resType = oReq.responseType;
        };

        this.download = function () {
            oReq.send(null);
        };
    };
}());

// DLP.SamplePlotter
(function () {
    DLP.SamplePlotter = SamplePlotter;
    function SamplePlotter(ui) {

        function parseBytes(bytes) {
            var sampleCount = bytes.length / 4;
            var rssi = new Array(sampleCount);
            var fm = new Array(sampleCount);
            var min = 100000, max = -100000;

            for (var i = 0; i < sampleCount; i += 1) {
                var sIdx = i * 4;
                rssi[i] = [i, bytes[sIdx + 1] * 256 + bytes[sIdx + 0]];
                fm[i] = [i, bytes[sIdx + 3] * 256 + bytes[sIdx + 2]];
                min = Math.min(min, rssi[i][1], fm[i][1]);
                max = Math.max(max, rssi[i][1], fm[i][1]);
            }

            console.log(min, max);

            return [{ min: min, max: max, label: "FM",  data: fm }, { label: "RSSI", data: rssi }];
        }

        function plotData($plotHolder, series) {

            $.plot($plotHolder, series, {
                series: {
                    lines: { lineWidth: 1, },
                    shadowSize: 0,
                },
                yaxis: {
                    zoomRange: [series[0].min, series[0].max],
                    panRange: [series[0].min, series[0].max]
                },
                xaxis: {
                    zoomRange: [Math.round(series[0].data.length / 10), series[0].data.length],
                    panRange: [0, series[0].data.length]
                },
                zoom: { interactive: true },
                pan: { interactive: true },
                legend: { show: true },
                grid: {
                  color: "rgba(0,0,128,0.25)",
                  backgroundColor: "rgba(255,255,255,0.75)"
                }
            });
        }

        var series = {};

        this.plotBytes = function (bytes) {
            plotData(ui.$fmPlotHolder, parseBytes(bytes));
        };
    }
}());

