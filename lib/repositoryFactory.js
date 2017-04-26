'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = repositoryFactory;

var _sharedFactory = require('./sharedFactory');

var _sharedFactory2 = _interopRequireDefault(_sharedFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function repositoryFactory(options = {}) {
  const shared = (0, _sharedFactory2.default)(_extends({}, options, {
    description: 'ECS repository',
    serviceInterfaceName: 'ECR',
    getFullName({ packageName }) {
      return packageName.replace(/^@/, '');
    }
  }));

  async function create() {
    shared.logCreating();
    try {
      await shared.sdkClient.createRepositoryAsync({ repositoryName: shared.fullName });
      shared.logCreated();
    } catch (ex) {
      if (ex.code === 'RepositoryAlreadyExistsException') {
        shared.logAlreadyCreated();
      } else {
        throw ex;
      }
    }
  }

  async function destroy() {
    try {
      shared.logDestroying();
      await shared.sdkClient.deleteRepositoryAsync({
        repositoryName: shared.fullName,
        force: true
      });
      shared.logDestroyed();
    } catch (ex) {
      if (ex.code === 'RepositoryNotFoundException') {
        shared.logAlreadyDestroyed();
      } else {
        throw ex;
      }
    }
  }

  return _extends({}, shared, {
    create,
    destroy
  });
}