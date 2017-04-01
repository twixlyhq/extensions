var twixlyExtension = {
  window: {
    updateHeight: function (height) {
      updateIframeHeight(height);
    }
  },
  field: {
    id: null,
    // type: null,
    schema: null,
    ui_schema: null,
    // value: null,
    getValue: function () {
      return twixlyField.value;
    },
    setValue: function (value) {
      return postMessenger.call('extension_field_set_value', {field_id: twixlyField.id, type: twixlyExtension.field.schema.type, value: value});
    },
    setInvalid: function (value) {
      return postMessenger.call('extension_field_set_invalid', {field_id: twixlyField.id, value: value});
    },
    validate: function (value) {
      return postMessenger.call('extension_field_validate', {field_id: twixlyField.id});
    },
    // removeValue: function () {
    //   return postMessenger.call('extension_field_remove_value', {field_id: twixlyField.id});
    // },
    onChange: function (cb, runInitValueChanged) {
      if (runInitValueChanged && twixlyFieldEvents.changeInitValue) {
        cb(twixlyFieldEvents.changeInitValue);
      }
      twixlyFieldEvents.changeInitValue = null;
      twixlyFieldEvents.valueChanged = cb;
    },
    onValidate: function (cb) {
      if (twixlyFieldEvents.validationInitValue) {
        cb(twixlyFieldEvents.validationInitValue);
      }
      twixlyFieldEvents.validationInitValue = null;
      twixlyFieldEvents.validation = cb;
    }
    // onFocus: function (cb) {
    //   // if (twixlyFieldEvents.focusInitValue) {
    //   //   cb(twixlyFieldEvents.focusInitValue);
    //   // }
    //   twixlyFieldEvents.focusInitValue = null;
    //   twixlyFieldEvents.focus = cb;
    // }
  },
  form: {
    submit: function () {
      return postMessenger.call('extension_form_submit');
    },
    setPadding: function () {
      return postMessenger.call('extension_form_submit');
    }
  },
  itemType: null,
  item: null,
  bucket: {
    get: function (endPoint, options) {
      return postMessenger.call('extension_bucket_get', {endPoint: endPoint, options: options});
    },
    post: function (endPoint, data) {
      return postMessenger.call('extension_bucket_post', {endPoint: endPoint, data: data});
    },
    put: function (endPoint, data) {
      return postMessenger.call('extension_bucket_put', {endPoint: endPoint, data: data});
    },
    delete: function (endPoint) {
      return postMessenger.call('extension_bucket_delete', {endPoint: endPoint});
    }
  },
  dialogs: {
    selectSingleItem: function (options) {
      return postMessenger.call('extension_dialogs_select_single_item', {options});
    },
    selectMultipleItems: function (options) {
      return postMessenger.call('extension_dialogs_select_multiple_items', {options});
    },
    selectSingleMedia: function (options) {
      return postMessenger.call('extension_dialogs_select_single_media', {options});
    },
    selectMultipleMedia: function (options) {
      return postMessenger.call('extension_dialogs_select_multiple_media', {options});
    },
    editItem: function (itemId, options) {
      return postMessenger.call('extension_dialogs_edit_item', {itemId: itemId, options: options});
    },
    editMediaItem: function (itemId, options) {
      return postMessenger.call('extension_dialogs_edit_media_item', {itemId: itemId, options: options});
    },
  }
};

var twixlyField = {
  value: undefined,
  id: undefined
}

var itemUpdate = null;

class PostMessenger {
  constructor(iframeId) {
    this._responseHandlers = {};

    this._dispatch = setPostMessage(iframeId);

    window.addEventListener('message', (event) => {
      this._onMessage(event.data);
    })
  }

  call(method, params) {
    const msgId = this._dispatch(method, params);
    return new Promise((resolve, reject) => {
      this._responseHandlers[msgId] = {resolve, reject}
    })
  }

  dispatch(method, params) {
    this._send(method, params)
  }

  _onMessage(message) {
    if (message.method === 'external_field') {
      if (itemUpdate) {
        itemUpdate.attributes[message.data.id].value = message.data.value;
        itemUpdate.attributes[message.data.id].errors = message.data.errors;
        if (twixlyFieldEvents.item.attributes[message.data.id] && twixlyFieldEvents.item.attributes[message.data.id].valueChanged) {
          var v = JSON.parse(JSON.stringify(itemUpdate.attributes[message.data.id]));
          // delete v.value;
          twixlyFieldEvents.item.attributes[message.data.id].valueChanged(v);
        }
      } else {
        // console.log('The extension where not loaded before another field sent an update to it. This is ok because if this field is not loaded yet it doesn't care about other fields data. This field name is: ' + message.data.id + '.');
      }
      return;
    }
    if (message.data) {
      if ((message.method === 'extension_field_set_value')) {
        if (twixlyFieldEvents.valueChanged) {
          twixlyFieldEvents.valueChanged(message.data);
        }
      }
      if ((message.method === 'extension_field_validate')) {
        if (twixlyFieldEvents.validation) {
          twixlyFieldEvents.validation(message.data);
        }
      }
      // if ((message.method === 'extension_field_check_focus')) {
      //   if (twixlyFieldEvents.focus) {
      //     twixlyFieldEvents.focus(message.data);
      //   }
      // }
    }
    if (message.id >= 0) {
      var id = message.id;
      var responseHandler = this._responseHandlers[id];
      if (!responseHandler) {
        return
      }
      if (message.init_extension) {
        twixlyField.value = message.data.value;
        // twixlyExtension.field.value = message.data.value;
        twixlyField.id = message.data.id;
        twixlyExtension.field.schema = message.data.schema;
        twixlyExtension.field.ui_schema = message.data.ui_schema;
        twixlyExtension.field.id = message.data.name;
        twixlyExtension.itemType = message.data.item_type;
        itemUpdate = JSON.parse(JSON.stringify(message.data.item));
        var item = JSON.parse(JSON.stringify(message.data.item));
        if (item.attributes) {
          for (var propKey in item.attributes) {
            var prop = item.attributes[propKey];
            prop.getValue = function() {
              return itemUpdate.attributes[this.id].value;
            }
            prop.setValue = function(value) {
              return postMessenger.call('extension_item_attributes_set_value', {field_id: this.id, value: value});
            }
            prop.onChange = function(cb) {
              twixlyFieldEvents.item.attributes[this.id] = {
                valueChanged: cb
              }
            }
            delete prop.value;
            // prop.onValidate = function(cb) {
            //   twixlyFieldEvents.item.attributes[this.id] = {
            //     validation: cb
            //   }
            // }
          }
        }
        twixlyExtension.item = item;
        var initValue = {
          isValid: message.data.isValid,
          errors: message.data.errors,
          value: message.data.value
        };
        twixlyFieldEvents.changeInitValue = initValue;
        twixlyFieldEvents.validationInitValue = initValue;
        // twixlyFieldEvents.focusInitValue = initValue;
        responseHandler.resolve(twixlyExtension);
        // Check if parent field is focused
        // postMessenger.call('extension_field_check_focus', {field_id: twixlyField.id});
      } else if (message.method.startsWith('extension_bucket_')) {
        if (message.data.errors) {
          responseHandler.reject(message.data.errors);
        } else {
          responseHandler.resolve(message.data.res);  
        }
      } else if (message.method.startsWith('extension_dialogs_select_')) {
        if (message.data.errors) {
          responseHandler.reject(message.data.errors);
        } else {
          responseHandler.resolve(message.data.res);  
        }
      } else if (message.method.startsWith('extension_dialogs_edit_')) {
        if (message.data.errors) {
          responseHandler.reject(message.data.errors);
        } else {
          responseHandler.resolve(message.data.res);
        }
      } else if (message.data) {
        if (message.data && typeof message.data.value !== 'undefined') {
          twixlyField.value = message.data.value;
          // twixlyExtension.field.value = message.data.value;
        }
        responseHandler.resolve(message.data);
      } else if (message.error) {
        responseHandler.reject(message.error);
      }
      delete this._responseHandlers[id];
    }
  } 
}

function setPostMessage (iframeId) {
  let msgCount = 0
  return function dispatch (method, params) {
    // params = params ?
    //          params : 
    //          {};
    // params.field_id = twixlyField.id;
    const msgId = msgCount++
    parent.postMessage({
      iframeId: iframeId,
      id: msgId,
      method,
      params
    }, '*');
    return msgId
  }
}

var twixlyFieldEvents = {
  onChange: null,
  onValidate: null,
  // onFocus: null,
  changeInitValue: null,
  validationInitValue: null,
  // focusInitValue: null,
  item: {
    attributes: {}
  }
}

var getQueryString = function (name) {
  var result = null;
  var regexS = "[\\?&#]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec('?' + window.location.href.split('?')[1]);
  if (results != null) {
    result = decodeURIComponent(results[1].replace(/\+/g, " "));
  }
  return result;
}

var iframeId = getQueryString('iframe_id');
var fieldId = getQueryString('field_id');

// Functions
function updateIframeHeight(height) {
  var interval = 50;
  var timeout = 500;
  var theInterval = setInterval(function(){sendHeight(height);}, interval);
  setTimeout(function() { clearInterval(theInterval); }, timeout);
  function sendHeight(height) {
    var height = height || document.body.offsetHeight;
    var targetWindow = parent.frames;
    var obj = {
      action: 'extension_update_height',
      height: height,
      id: iframeId
    }
    targetWindow.postMessage(obj, '*');
  }
  sendHeight(height);
}

Extension = function() {}
Extension.prototype.init = function(options) {
  // let promise = new Promise((resolve, reject) => {
    // { disableDefault: ['*'] }
    options = options ?
              options :
              {};
    options.height = options.height || document.body.offsetHeight;
    // if (!options && options.disableDefault) {
    //   postMessenger.call('extension_field_disable_default', {field_id: twixlyField.id, value: options.disableDefault});
    // }
    return postMessenger.call('extension_init', {field_id: fieldId, options: options});
    // function callback() {
    //   // if (options && options.disableDefault) {
    //   //   postMessenger.call('extension_field_disable_default', {field_id: twixlyField.id, value: options.disableDefault});
    //   // }
    //   resolve(twixlyExtension);
    // }
    // if (
    //   document.readyState === 'complete'// ||
    //   //(document.readyState !== 'loading' && !document.documentElement.doScroll)
    // ) {
    //   callback();
    // } else {
    //   document.addEventListener('DOMContentLoaded', callback);
    // }
    // function goo() {
    //   if (document.readyState === 'complete') {
    //     callback();
    //   } else {
    //     setTimeout(function() { goo() }, 1);
    //   }
    // }
    // goo();
  // });
  // return promise;
}

var postMessenger = new PostMessenger(iframeId);

window.twixly = {};
window.twixly.call = function(method, params) {
  return postMessenger.call(method, params);
}
window.twixly.extension = new Extension;