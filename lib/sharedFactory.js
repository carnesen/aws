'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = sharedFactory;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const REGION = 'us-east-2';

_awsSdk2.default.config.update({ region: REGION });

function getPackageName() {
  const packageContents = _fs2.default.readFileSync(_path2.default.join(process.cwd(), 'package.json'), { encoding: 'utf8' });
  return JSON.parse(packageContents).name;
}

function sharedFactory(options = {}) {
  const {
    description,
    packageName = getPackageName(),
    region = REGION,
    serviceInterfaceName,
    getFullName = function ({ packageName }) {
      return packageName;
    }
  } = options;

  const fullName = getFullName({ packageName });
  const verboseName = `${description} "${fullName}"`;
  const ServiceInterface = _awsSdk2.default[serviceInterfaceName];

  const sdkClient = new ServiceInterface();
  _bluebird2.default.promisifyAll(sdkClient);

  function createLog(action) {
    return function () {
      (0, _util.echo)(`${verboseName}: ${action}`);
    };
  }

  return {
    description,
    fullName,
    logCreating: createLog('creating ...'),
    logCreated: createLog('created'),
    logAlreadyCreated: createLog('already exists'),
    logIdempotentCreated: createLog('created if it didn\'t exist'),
    logDestroying: createLog('destroying ...'),
    logDestroyed: createLog('destroyed'),
    logAlreadyDestroyed: createLog('does not exist'),
    logIdempotentDestroyed: createLog('destroyed if it existed'),
    packageName,
    region,
    sdkClient
  };
}