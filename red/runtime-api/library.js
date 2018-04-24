/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

/**
 * @namespace RED.library
 */

var runtime;

var api = module.exports = {
    init: function(_runtime) {
        runtime = _runtime;
    },

    /**
    * Gets an entry from the library.
    * @param {Object} opts
    * @param {User} opts.user - the user calling the api
    * @param {String} opts.type - the type of entry
    * @param {String} opts.path - the path of the entry
    * @return {Promise<String|Object>} - resolves when complete
    * @memberof RED.library
    */
    getEntry: function(opts) {
        return new Promise(function(resolve,reject) {
            runtime.library.getEntry(opts.type,opts.path).then(function(result) {
                runtime.log.audit({event: "library.get",type:opts.type,path:opts.path});
                return resolve(result);
            }).catch(function(err) {
                if (err) {
                    runtime.log.warn(runtime.log._("api.library.error-load-entry",{path:opts.path,message:err.toString()}));
                    if (err.code === 'forbidden') {
                        err.status = 403;
                        return reject(err);
                    } else if (err.code === "not_found") {
                        err.status = 404;
                    } else {
                        err.status = 400;
                    }
                    runtime.log.audit({event: "library.get",type:opts.type,path:opts.path,error:err.code});
                    return reject(err);
                }
                runtime.log.audit({event: "library.get",type:opts.type,error:"not_found"});
                var error = new Error();
                error.code = "not_found";
                error.status = 404;
                return reject(error);
            });
        })
    },

    /**
    * Saves an entry to the library
    * @param {Object} opts
    * @param {User} opts.user - the user calling the api
    * @param {String} opts.type - the type of entry
    * @param {String} opts.path - the path of the entry
    * @param {Object} opts.meta - any meta data associated with the entry
    * @param {String} opts.body - the body of the entry
    * @return {Promise} - resolves when complete
    * @memberof RED.library
    */
    saveEntry: function(opts) {
        return new Promise(function(resolve,reject) {
            runtime.library.saveEntry(opts.type,opts.path,opts.meta,opts.body).then(function() {
                runtime.log.audit({event: "library.set",type:opts.type,path:opts.path});
                return resolve();
            }).catch(function(err) {
                runtime.log.warn(runtime.log._("api.library.error-save-entry",{path:opts.path,message:err.toString()}));
                if (err.code === 'forbidden') {
                    runtime.log.audit({event: "library.set",type:opts.type,path:opts.path,error:"forbidden"});
                    err.status = 403;
                    return reject(err);
                }
                runtime.log.audit({event: "library.set",type:opts.type,path:opts.path,error:"unexpected_error",message:err.toString()});
                var error = new Error();
                error.status = 400;
                return reject(error);
            });
        })
    },
    /**
    * Returns a complete listing of all entries of a given type in the library.
    * @param {Object} opts
    * @param {User} opts.user - the user calling the api
    * @param {String} opts.type - the type of entry
    * @return {Promise<Object>} - the entry listing
    * @memberof RED.library
    */
    getEntries: function(opts) {
        return new Promise(function(resolve,reject) {
            if (opts.type !== 'flows') {
                return reject(new Error("API only supports flows"));

            }
            runtime.storage.getAllFlows().then(function(flows) {
                runtime.log.audit({event: "library.get.all",type:"flow"});
                var examples = runtime.nodes.getNodeExampleFlows();
                if (examples) {
                    flows.d = flows.d||{};
                    flows.d._examples_ = examples;
                }
                return resolve(flows);
            });
        })
    }
}
