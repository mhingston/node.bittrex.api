/* ============================================================
 * node.bittrex.api
 * https://github.com/n0mad01/node.bittrex.api
 *
 * ============================================================
 * Copyright 2014-2015, Adrian Soluch - http://soluch.us/
 * Released under the MIT License
 * ============================================================ */
const NodeBittrexApi = () =>
{    
    const crypto = require('crypto');
    const request = require('request');
    const JSONStream = require('JSONStream');
    const es = require('event-stream');
    const nonce = require('nonce')();

    const request_options =
    {
        method: 'GET',
        agent: false,
        headers:
        {
            "User-Agent": 'Mozilla/4.0 (compatible; Node Bittrex API)',
            "Content-type": 'application/x-www-form-urlencode'
        }
    };

    const opts =
    {
        baseUrl: 'https://bittrex.com/api/v1.1',
        apikey: 'APIKEY',
        apisecret: 'APISECRET',
        verbose: false,
        cleartext: false,
        stream: false
    };

    const extractOptions = (options) =>
    {
        const o = Object.keys(options);

        for(let i = 0; i < o.length; i++)
        {
            opts[o[i]] = options[o[i]];
        }
    };

    const apiCredentials = (uri) =>
    {
        const options =
        {
            apikey: opts.apikey,
            nonce: nonce()
        };

        return setRequestUriGetParams(uri, options);
    };

    const setRequestUriGetParams = (uri, options) =>
    {
        let op;

        if(typeof(uri) === 'object')
        {
            op = uri;
            uri = op.uri;
        }
        
        else
        {
            op = request_options;
        }

        const o = Object.keys(options);

        for(let i = 0; i < o.length; i++)
        {
            uri = updateQueryStringParameter(uri, o[i], options[o[i]]);
        }

        op.headers.apisign = crypto.createHmac('sha512', opts.apisecret).update(uri).digest('hex'); // setting the HMAC hash `apisign` http header
        op.uri = uri;

        return op;
    };

    const updateQueryStringParameter = (uri, key, value) =>
    {
        const re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
        const separator = uri.indexOf('?') !== -1 ? "&" : "?";

        if(uri.match(re))
        {
            uri = uri.replace(re, '$1' + key + "=" + value + '$2');
        }
        
        else
        {
            uri = uri + separator + key + "=" + value;
        }

        return uri;
    };

    const sendRequestCallback = (callback, op) =>
    {
        return new Promise((resolve, reject) =>
        {
            if(typeof callback != 'function')
            {
                callback = () => {};
                opts.stream = false;
            }

            let start = Date.now();

            switch(opts.stream)
            {
                case true:
                    request(op)
                    .pipe(JSONStream.parse('*'))
                    .pipe(es.mapSync((data) =>
                    {
                        if(opts.verbose)
                        {
                            console.log(`streamed from ${op.uri} in: ${(Date.now() - start) / 1000}s`);
                        }

                        callback(data);
                    })) ;
                    break;

                    case false:
                        request(op, (error, result, body) =>
                        {
                            if(!body || !result || result.statusCode != 200)
                            {
                                callback({error : error, result : result});
                                return reject(error);
                            }
                            
                            else
                            {
                                if(opts.verbose)
                                {
                                    console.log(`requested from ${result.request.href} in: ${(Date.now() - start) / 1000}s`);
                                }
                                
                                callback(opts.cleartext ? body : JSON.parse(body));
                                return resolve(opts.cleartext ? body : JSON.parse(body));
                            }
                        });
                    break;
            }
        });
    };

    return {
        options: (options) =>
        {
            extractOptions(options);
        },
        sendCustomRequest: (request_string, callback, credentials) =>
        {
            let op;

            if(credentials === true)
            {
                op = apiCredentials(request_string);
            }
            
            else
            {
                op = request_options;
                op.uri = request_string;
            }

            return sendRequestCallback(callback, op);
        },
        getmarkets: (callback) =>
        {
            const op = request_options;
            op.uri = opts.baseUrl + '/public/getmarkets';
            return sendRequestCallback(callback, op);
        },
        getcurrencies: (callback) =>
        {
            const op = request_options;
            op.uri = opts.baseUrl + '/public/getcurrencies';
            return sendRequestCallback(callback, op);
        },
        getticker: (options, callback) =>
        {
            const op = setRequestUriGetParams(opts.baseUrl + '/public/getticker', options);
            return sendRequestCallback(callback, op);
        },
        getmarketsummaries: (callback) =>
        {
            const op = request_options;
            op.uri = opts.baseUrl + '/public/getmarketsummaries';
            return sendRequestCallback(callback, op);
        },
        getmarketsummary: (options, callback) =>
        {
            const op = setRequestUriGetParams(opts.baseUrl + '/public/getmarketsummary', options);
            return sendRequestCallback(callback, op);
        },
        getorderbook: (options, callback) =>
        {
            const op = setRequestUriGetParams(opts.baseUrl + '/public/getorderbook', options);
            return sendRequestCallback(callback, op);
        },
        getmarkethistory: (options, callback) =>
        {
            const op = setRequestUriGetParams(opts.baseUrl + '/public/getmarkethistory', options);
            return sendRequestCallback(callback, op);
        },
        buylimit: (options, callback) =>
        {
            const op = setRequestUriGetParams(apiCredentials(opts.baseUrl + '/market/buylimit'), options);
            return sendRequestCallback(callback, op);
        },

        buymarket: (options, callback) =>
        {
            const op = setRequestUriGetParams(apiCredentials(opts.baseUrl + '/market/buymarket'), options);
            return sendRequestCallback(callback, op);
        },
        selllimit: (options, callback) =>
        {
            const op = setRequestUriGetParams(apiCredentials(opts.baseUrl + '/market/selllimit'), options);
            return sendRequestCallback(callback, op);
        },
        sellmarket: (options, callback) =>
        {
            const op = setRequestUriGetParams(apiCredentials(opts.baseUrl + '/market/sellmarket'), options);
            return sendRequestCallback(callback, op);
        },
        cancel: (options, callback) =>
        {
            const op = setRequestUriGetParams(apiCredentials(opts.baseUrl + '/market/cancel'), options);
            return sendRequestCallback(callback, op);
        },
        getopenorders: (options, callback) =>
        {
            const op = setRequestUriGetParams(apiCredentials(opts.baseUrl + '/market/getopenorders'), options);
            return sendRequestCallback(callback, op);
        },
        getbalances: (callback) =>
        {
            const op = apiCredentials(opts.baseUrl + '/account/getbalances');
            return sendRequestCallback(callback, op);
        },
        getbalance: (options, callback) =>
        {
            const op = setRequestUriGetParams(apiCredentials(opts.baseUrl + '/account/getbalance'), options);
            return sendRequestCallback(callback, op);
        },
        getwithdrawalhistory: (options, callback) =>
        {
            const op = setRequestUriGetParams(apiCredentials(opts.baseUrl + '/account/getwithdrawalhistory'), options);
            return sendRequestCallback(callback, op);
        },
        getdepositaddress: (options, callback) =>
        {
            const op = setRequestUriGetParams(apiCredentials(opts.baseUrl + '/account/getdepositaddress'), options);
            return sendRequestCallback(callback, op);
        },
        getdeposithistory: (options, callback) =>
        {
            const op = setRequestUriGetParams(apiCredentials(opts.baseUrl + '/account/getdeposithistory'), options);
            return sendRequestCallback(callback, op);
        },
        getorderhistory: (options, callback) =>
        {
            const op = setRequestUriGetParams(apiCredentials(opts.baseUrl + '/account/getorderhistory'), options);
            return sendRequestCallback(callback, op);
        },
        getorder: (options, callback) =>
        {
            const op = setRequestUriGetParams(apiCredentials(opts.baseUrl + '/account/getorder'), options);
            return sendRequestCallback(callback, op);
        },
        withdraw: (options, callback) =>
        {
            const op = setRequestUriGetParams(apiCredentials(opts.baseUrl + '/account/withdraw'), options);
            return sendRequestCallback(callback, op);
        }
    };
};

module.exports = NodeBittrexApi();
