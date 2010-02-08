YUI.add('iframe', function(Y) {

    var IFrame = function(o) {
        IFrame.superclass.constructor.apply(this, arguments);
    };

    Y.extend(IFrame, Y.Base, {
        _iframe: null,
        _delayed: null,
        _instance: null,
        _ready: null,
        appendTo: function(n) {
            if (this._ready) {
                n = Y.one(n);
                n.append(this._iframe);
            } else {
                this.on('ready', Y.bind(function(n) {
                    n = Y.one(n);
                    n.append(this._iframe);
                }, this, n));
            }
        },
        _create: function() {
            var win, doc;
            if (this.get('type') == 'iframe') {
                this._iframe = Y.Node.create(Y.substitute(IFrame.HTML, { SRC: this.get('src') }));
                this._iframe.setStyle('visibility', 'hidden');
                this.get('container').append(this._iframe);
                win = Y.Node.getDOMNode(this._iframe.get('contentWindow'));
                doc = Y.Node.getDOMNode(this._iframe.get('contentWindow.document'));
            }
            if (this.get('type') == 'window') {
                win = Y.config.win.open(this.get('src'), Y.guid(), 'menubar=1,resizable=1,width=350,height=250');
                doc = win.document;
                this._iframe = Y.one(win);
            }
            

            var inst,
            cb = Y.bind(function(i) {
                //console.info('Internal instance loaded with node: ', inst, this);
                this._instanceLoaded(inst);
            }, this),
            args = Y.clone(this.get('use')),
            config = {
                debug: false,
                bootstrap: false,
                win: win,
                doc: doc
            },
            fn = function() {
                //console.info('New Modules Loaded into main instance');
                //console.log(config);
                inst = YUI(config);
                //console.log('Creating new internal instance with node only: ', inst.id, inst);
                inst.use('node-base', cb);
            };

            args.push(fn);

            //console.info('Adding new modules to main instance: ', args);
            Y.use.apply(Y, args);
        },
        _onDomEvent: function(e) {
            var xy = this._iframe.getXY(),
                node = this._instance.one('win');

            //console.log('onDOMEvent: ', e.type, e, xy);
            if (e.pageX && e.pageY) {
                e.frameX = xy[0] + e.pageX - node.get('scrollLeft');
                e.frameY = xy[1] + e.pageY - node.get('scrollTop');
            }
            this.publish(e.type, {
                stoppedFn: Y.bind(function(ev, domev) {
                    ev.halt();
                }, this, e),
                preventedFn: Y.bind(function(ev, domev) {
                    ev.preventDefault();
                }, this, e)
            });
            this.fire(e.type, e);
        },
        _setup: function() {
            if (!this._ready) {
                var obj = {},
                    inst = this.getInstance(),
                    fn = Y.bind(this._onDomEvent, this);
                
                Y.each(Y.Node.DOM_EVENTS, function(v, k) {
                    if (v === 1) {
                        inst.on(k, fn, inst.config.doc);
                    }
                });

                this._iframe.setStyle('visibility', 'visible');
                this._ready = true;
                this.fire('ready');
            }
        },
        _instanceLoaded: function(inst) {
            this._instance = inst;
            this._instance.on('contentready', Y.bind(function() {
                var inst = this.getInstance();
                //console.log('On available for body of iframe');
                var args = Y.clone(this.get('use'));
                args.push(Y.bind(function() {
                    //console.info('Callback from final internal use call');
                    this._setup();

                }, this));
                //console.info('Calling use on internal instance: ', args);
                this.getInstance().use.apply(this.getInstance(), args);

                
            }, this), 'body');
            
            

            var html = Y.substitute(IFrame.PAGE_HTML, {
                CONTENT: this.get('content')
            }),
            doc = this._instance.config.doc;
            if (this.get('designMode')) {
                doc.designMode = 'on';
            }
            //console.info('Injecting content into iframe');
            doc.open();
            doc.write(html);
            doc.close();

        },
        delegate: function(type, fn, cont, sel) {
            var inst = this.getInstance();
            if (!inst) {
                Y.log('Delegate events can not be attached until after the ready event has fired.', 'error', 'iframe');
                return false;
            }
            if (!sel) {
                sel = cont;
                cont = 'body';
            }
            return inst.delegate(type, fn, cont, sel);
        },
        getInstance: function() {
            return this._instance;
        },
        render: function() {
            this._create();
            return this;
        },
        initializer: function() {
            this._delayed = [];
        },
        destructor: function() {
        }
    }, {
        HTML: '<iframe src="{SRC}" border="0" frameBorder="0" marginWidth="0" marginHeight="0" leftMargin="0" topMargin="0" allowTransparency="true" width="100%" height="100%"></iframe>',
        PAGE_HTML: '<html><head><title></title><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /></head><body>{CONTENT}</body></html>',
        NAME: 'iframe',
        ATTRS: {
            src: {
                value: ((Y.UA.ie) ? 'javascript:false;' : 'javascript:;')
            },
            type: {
                value: 'iframe'
            },
            designMode: {
                value: false
            },
            content: {
                value: ''
            },
            use: {
                value: ['node', 'selector-css3']
            },
            container: {
                value: 'body',
                setter: function(n) {
                    return Y.one(n);
                }
            },
            id: {
                getter: function(id) {
                    if (!id) {
                        id = Y.guid();
                    }
                    if (id.indexOf('iframe') !== 0) {
                        id = 'iframe-' + id;
                    }
                    return id;
                }
            }
        }
    });

    Y.IFrame = IFrame;

}, '@VERSION@' ,{requires:['base', 'node', 'selector-css3'], skinnable:false });
