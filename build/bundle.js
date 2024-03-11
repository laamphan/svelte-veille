
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function toClassName(value) {
      let result = '';

      if (typeof value === 'string' || typeof value === 'number') {
        result += value;
      } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
          result = value.map(toClassName).filter(Boolean).join(' ');
        } else {
          for (let key in value) {
            if (value[key]) {
              result && (result += ' ');
              result += key;
            }
          }
        }
      }

      return result;
    }

    function classnames(...args) {
      return args.map(toClassName).filter(Boolean).join(' ');
    }

    /* node_modules/sveltestrap/src/Container.svelte generated by Svelte v3.46.4 */
    const file$5 = "node_modules/sveltestrap/src/Container.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);
    	let div_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$5, 23, 0, 542);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[9],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[9])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, null),
    						null
    					);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class","sm","md","lg","xl","xxl","fluid"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Container', slots, ['default']);
    	let { class: className = '' } = $$props;
    	let { sm = undefined } = $$props;
    	let { md = undefined } = $$props;
    	let { lg = undefined } = $$props;
    	let { xl = undefined } = $$props;
    	let { xxl = undefined } = $$props;
    	let { fluid = false } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('class' in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ('sm' in $$new_props) $$invalidate(3, sm = $$new_props.sm);
    		if ('md' in $$new_props) $$invalidate(4, md = $$new_props.md);
    		if ('lg' in $$new_props) $$invalidate(5, lg = $$new_props.lg);
    		if ('xl' in $$new_props) $$invalidate(6, xl = $$new_props.xl);
    		if ('xxl' in $$new_props) $$invalidate(7, xxl = $$new_props.xxl);
    		if ('fluid' in $$new_props) $$invalidate(8, fluid = $$new_props.fluid);
    		if ('$$scope' in $$new_props) $$invalidate(9, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		className,
    		sm,
    		md,
    		lg,
    		xl,
    		xxl,
    		fluid,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('className' in $$props) $$invalidate(2, className = $$new_props.className);
    		if ('sm' in $$props) $$invalidate(3, sm = $$new_props.sm);
    		if ('md' in $$props) $$invalidate(4, md = $$new_props.md);
    		if ('lg' in $$props) $$invalidate(5, lg = $$new_props.lg);
    		if ('xl' in $$props) $$invalidate(6, xl = $$new_props.xl);
    		if ('xxl' in $$props) $$invalidate(7, xxl = $$new_props.xxl);
    		if ('fluid' in $$props) $$invalidate(8, fluid = $$new_props.fluid);
    		if ('classes' in $$props) $$invalidate(0, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, sm, md, lg, xl, xxl, fluid*/ 508) {
    			$$invalidate(0, classes = classnames(className, {
    				'container-sm': sm,
    				'container-md': md,
    				'container-lg': lg,
    				'container-xl': xl,
    				'container-xxl': xxl,
    				'container-fluid': fluid,
    				container: !sm && !md && !lg && !xl && !xxl && !fluid
    			}));
    		}
    	};

    	return [classes, $$restProps, className, sm, md, lg, xl, xxl, fluid, $$scope, slots];
    }

    class Container extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			class: 2,
    			sm: 3,
    			md: 4,
    			lg: 5,
    			xl: 6,
    			xxl: 7,
    			fluid: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Container",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get class() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sm() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sm(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get md() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set md(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lg() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lg(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xl() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xl(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xxl() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xxl(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fluid() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fluid(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Nav.svelte generated by Svelte v3.46.4 */
    const file$4 = "node_modules/sveltestrap/src/Nav.svelte";

    function create_fragment$4(ctx) {
    	let ul;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[12].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);
    	let ul_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
    	let ul_data = {};

    	for (let i = 0; i < ul_levels.length; i += 1) {
    		ul_data = assign(ul_data, ul_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			if (default_slot) default_slot.c();
    			set_attributes(ul, ul_data);
    			add_location(ul, file$4, 39, 0, 941);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			if (default_slot) {
    				default_slot.m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[11],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null),
    						null
    					);
    				}
    			}

    			set_attributes(ul, ul_data = get_spread_update(ul_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getVerticalClass(vertical) {
    	if (vertical === false) {
    		return false;
    	} else if (vertical === true || vertical === 'xs') {
    		return 'flex-column';
    	}

    	return `flex-${vertical}-column`;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let classes;

    	const omit_props_names = [
    		"class","tabs","pills","vertical","horizontal","justified","fill","navbar","card"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Nav', slots, ['default']);
    	let { class: className = '' } = $$props;
    	let { tabs = false } = $$props;
    	let { pills = false } = $$props;
    	let { vertical = false } = $$props;
    	let { horizontal = '' } = $$props;
    	let { justified = false } = $$props;
    	let { fill = false } = $$props;
    	let { navbar = false } = $$props;
    	let { card = false } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('class' in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ('tabs' in $$new_props) $$invalidate(3, tabs = $$new_props.tabs);
    		if ('pills' in $$new_props) $$invalidate(4, pills = $$new_props.pills);
    		if ('vertical' in $$new_props) $$invalidate(5, vertical = $$new_props.vertical);
    		if ('horizontal' in $$new_props) $$invalidate(6, horizontal = $$new_props.horizontal);
    		if ('justified' in $$new_props) $$invalidate(7, justified = $$new_props.justified);
    		if ('fill' in $$new_props) $$invalidate(8, fill = $$new_props.fill);
    		if ('navbar' in $$new_props) $$invalidate(9, navbar = $$new_props.navbar);
    		if ('card' in $$new_props) $$invalidate(10, card = $$new_props.card);
    		if ('$$scope' in $$new_props) $$invalidate(11, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		className,
    		tabs,
    		pills,
    		vertical,
    		horizontal,
    		justified,
    		fill,
    		navbar,
    		card,
    		getVerticalClass,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('className' in $$props) $$invalidate(2, className = $$new_props.className);
    		if ('tabs' in $$props) $$invalidate(3, tabs = $$new_props.tabs);
    		if ('pills' in $$props) $$invalidate(4, pills = $$new_props.pills);
    		if ('vertical' in $$props) $$invalidate(5, vertical = $$new_props.vertical);
    		if ('horizontal' in $$props) $$invalidate(6, horizontal = $$new_props.horizontal);
    		if ('justified' in $$props) $$invalidate(7, justified = $$new_props.justified);
    		if ('fill' in $$props) $$invalidate(8, fill = $$new_props.fill);
    		if ('navbar' in $$props) $$invalidate(9, navbar = $$new_props.navbar);
    		if ('card' in $$props) $$invalidate(10, card = $$new_props.card);
    		if ('classes' in $$props) $$invalidate(0, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, navbar, horizontal, vertical, tabs, card, pills, justified, fill*/ 2044) {
    			$$invalidate(0, classes = classnames(className, navbar ? 'navbar-nav' : 'nav', horizontal ? `justify-content-${horizontal}` : false, getVerticalClass(vertical), {
    				'nav-tabs': tabs,
    				'card-header-tabs': card && tabs,
    				'nav-pills': pills,
    				'card-header-pills': card && pills,
    				'nav-justified': justified,
    				'nav-fill': fill
    			}));
    		}
    	};

    	return [
    		classes,
    		$$restProps,
    		className,
    		tabs,
    		pills,
    		vertical,
    		horizontal,
    		justified,
    		fill,
    		navbar,
    		card,
    		$$scope,
    		slots
    	];
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			class: 2,
    			tabs: 3,
    			pills: 4,
    			vertical: 5,
    			horizontal: 6,
    			justified: 7,
    			fill: 8,
    			navbar: 9,
    			card: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nav",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get class() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tabs() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabs(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pills() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pills(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get vertical() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set vertical(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get horizontal() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set horizontal(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get justified() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set justified(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fill() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fill(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get navbar() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set navbar(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get card() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set card(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Navbar.svelte generated by Svelte v3.46.4 */
    const file$3 = "node_modules/sveltestrap/src/Navbar.svelte";

    // (44:2) {:else}
    function create_else_block(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[11],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(44:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (40:2) {#if container}
    function create_if_block(ctx) {
    	let container_1;
    	let current;

    	container_1 = new Container({
    			props: {
    				fluid: /*container*/ ctx[0] === 'fluid',
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(container_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(container_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const container_1_changes = {};
    			if (dirty & /*container*/ 1) container_1_changes.fluid = /*container*/ ctx[0] === 'fluid';

    			if (dirty & /*$$scope*/ 2048) {
    				container_1_changes.$$scope = { dirty, ctx };
    			}

    			container_1.$set(container_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(container_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(container_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(container_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(40:2) {#if container}",
    		ctx
    	});

    	return block;
    }

    // (41:4) <Container fluid={container === 'fluid'}>
    function create_default_slot$1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[11],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(41:4) <Container fluid={container === 'fluid'}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let nav;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*container*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let nav_levels = [/*$$restProps*/ ctx[2], { class: /*classes*/ ctx[1] }];
    	let nav_data = {};

    	for (let i = 0; i < nav_levels.length; i += 1) {
    		nav_data = assign(nav_data, nav_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			if_block.c();
    			set_attributes(nav, nav_data);
    			add_location(nav, file$3, 38, 0, 889);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			if_blocks[current_block_type_index].m(nav, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(nav, null);
    			}

    			set_attributes(nav, nav_data = get_spread_update(nav_levels, [
    				dirty & /*$$restProps*/ 4 && /*$$restProps*/ ctx[2],
    				(!current || dirty & /*classes*/ 2) && { class: /*classes*/ ctx[1] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getExpandClass(expand) {
    	if (expand === false) {
    		return false;
    	} else if (expand === true || expand === 'xs') {
    		return 'navbar-expand';
    	}

    	return `navbar-expand-${expand}`;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class","container","color","dark","expand","fixed","light","sticky"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navbar', slots, ['default']);
    	setContext('navbar', { inNavbar: true });
    	let { class: className = '' } = $$props;
    	let { container = 'fluid' } = $$props;
    	let { color = '' } = $$props;
    	let { dark = false } = $$props;
    	let { expand = '' } = $$props;
    	let { fixed = '' } = $$props;
    	let { light = false } = $$props;
    	let { sticky = '' } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(2, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('class' in $$new_props) $$invalidate(3, className = $$new_props.class);
    		if ('container' in $$new_props) $$invalidate(0, container = $$new_props.container);
    		if ('color' in $$new_props) $$invalidate(4, color = $$new_props.color);
    		if ('dark' in $$new_props) $$invalidate(5, dark = $$new_props.dark);
    		if ('expand' in $$new_props) $$invalidate(6, expand = $$new_props.expand);
    		if ('fixed' in $$new_props) $$invalidate(7, fixed = $$new_props.fixed);
    		if ('light' in $$new_props) $$invalidate(8, light = $$new_props.light);
    		if ('sticky' in $$new_props) $$invalidate(9, sticky = $$new_props.sticky);
    		if ('$$scope' in $$new_props) $$invalidate(11, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		Container,
    		setContext,
    		className,
    		container,
    		color,
    		dark,
    		expand,
    		fixed,
    		light,
    		sticky,
    		getExpandClass,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('className' in $$props) $$invalidate(3, className = $$new_props.className);
    		if ('container' in $$props) $$invalidate(0, container = $$new_props.container);
    		if ('color' in $$props) $$invalidate(4, color = $$new_props.color);
    		if ('dark' in $$props) $$invalidate(5, dark = $$new_props.dark);
    		if ('expand' in $$props) $$invalidate(6, expand = $$new_props.expand);
    		if ('fixed' in $$props) $$invalidate(7, fixed = $$new_props.fixed);
    		if ('light' in $$props) $$invalidate(8, light = $$new_props.light);
    		if ('sticky' in $$props) $$invalidate(9, sticky = $$new_props.sticky);
    		if ('classes' in $$props) $$invalidate(1, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, expand, light, dark, color, fixed, sticky*/ 1016) {
    			$$invalidate(1, classes = classnames(className, 'navbar', getExpandClass(expand), {
    				'navbar-light': light,
    				'navbar-dark': dark,
    				[`bg-${color}`]: color,
    				[`fixed-${fixed}`]: fixed,
    				[`sticky-${sticky}`]: sticky
    			}));
    		}
    	};

    	return [
    		container,
    		classes,
    		$$restProps,
    		className,
    		color,
    		dark,
    		expand,
    		fixed,
    		light,
    		sticky,
    		slots,
    		$$scope
    	];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			class: 3,
    			container: 0,
    			color: 4,
    			dark: 5,
    			expand: 6,
    			fixed: 7,
    			light: 8,
    			sticky: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get class() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get container() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set container(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dark() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dark(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get expand() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expand(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fixed() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fixed(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get light() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set light(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sticky() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sticky(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/NavItem.svelte generated by Svelte v3.46.4 */
    const file$2 = "node_modules/sveltestrap/src/NavItem.svelte";

    function create_fragment$2(ctx) {
    	let li;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);
    	let li_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
    	let li_data = {};

    	for (let i = 0; i < li_levels.length; i += 1) {
    		li_data = assign(li_data, li_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			if (default_slot) default_slot.c();
    			set_attributes(li, li_data);
    			add_location(li, file$2, 10, 0, 219);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			if (default_slot) {
    				default_slot.m(li, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[4],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[4])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null),
    						null
    					);
    				}
    			}

    			set_attributes(li, li_data = get_spread_update(li_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class","active"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NavItem', slots, ['default']);
    	let { class: className = '' } = $$props;
    	let { active = false } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('class' in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ('active' in $$new_props) $$invalidate(3, active = $$new_props.active);
    		if ('$$scope' in $$new_props) $$invalidate(4, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({ classnames, className, active, classes });

    	$$self.$inject_state = $$new_props => {
    		if ('className' in $$props) $$invalidate(2, className = $$new_props.className);
    		if ('active' in $$props) $$invalidate(3, active = $$new_props.active);
    		if ('classes' in $$props) $$invalidate(0, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, active*/ 12) {
    			$$invalidate(0, classes = classnames(className, 'nav-item', active ? 'active' : false));
    		}
    	};

    	return [classes, $$restProps, className, active, $$scope, slots];
    }

    class NavItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { class: 2, active: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavItem",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get class() {
    		throw new Error("<NavItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<NavItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<NavItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<NavItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/NavLink.svelte generated by Svelte v3.46.4 */
    const file$1 = "node_modules/sveltestrap/src/NavLink.svelte";

    function create_fragment$1(ctx) {
    	let a;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

    	let a_levels = [
    		/*$$restProps*/ ctx[3],
    		{ href: /*href*/ ctx[0] },
    		{ class: /*classes*/ ctx[1] }
    	];

    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			set_attributes(a, a_data);
    			add_location(a, file$1, 27, 0, 472);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a, "click", /*click_handler*/ ctx[9], false, false, false),
    					listen_dev(a, "click", /*handleClick*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 128)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[7],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[7])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[7], dirty, null),
    						null
    					);
    				}
    			}

    			set_attributes(a, a_data = get_spread_update(a_levels, [
    				dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3],
    				(!current || dirty & /*href*/ 1) && { href: /*href*/ ctx[0] },
    				(!current || dirty & /*classes*/ 2) && { class: /*classes*/ ctx[1] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class","disabled","active","href"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NavLink', slots, ['default']);
    	let { class: className = '' } = $$props;
    	let { disabled = false } = $$props;
    	let { active = false } = $$props;
    	let { href = '#' } = $$props;

    	function handleClick(e) {
    		if (disabled) {
    			e.preventDefault();
    			e.stopImmediatePropagation();
    			return;
    		}

    		if (href === '#') {
    			e.preventDefault();
    		}
    	}

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('class' in $$new_props) $$invalidate(4, className = $$new_props.class);
    		if ('disabled' in $$new_props) $$invalidate(5, disabled = $$new_props.disabled);
    		if ('active' in $$new_props) $$invalidate(6, active = $$new_props.active);
    		if ('href' in $$new_props) $$invalidate(0, href = $$new_props.href);
    		if ('$$scope' in $$new_props) $$invalidate(7, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		className,
    		disabled,
    		active,
    		href,
    		handleClick,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('className' in $$props) $$invalidate(4, className = $$new_props.className);
    		if ('disabled' in $$props) $$invalidate(5, disabled = $$new_props.disabled);
    		if ('active' in $$props) $$invalidate(6, active = $$new_props.active);
    		if ('href' in $$props) $$invalidate(0, href = $$new_props.href);
    		if ('classes' in $$props) $$invalidate(1, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, disabled, active*/ 112) {
    			$$invalidate(1, classes = classnames(className, 'nav-link', { disabled, active }));
    		}
    	};

    	return [
    		href,
    		classes,
    		handleClick,
    		$$restProps,
    		className,
    		disabled,
    		active,
    		$$scope,
    		slots,
    		click_handler
    	];
    }

    class NavLink extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			class: 4,
    			disabled: 5,
    			active: 6,
    			href: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavLink",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get class() {
    		throw new Error("<NavLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<NavLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<NavLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<NavLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<NavLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<NavLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<NavLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<NavLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.46.4 */
    const file = "src/App.svelte";

    // (17:11) <NavLink href="#tutorial">
    function create_default_slot_7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Tutoriel");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(17:11) <NavLink href=\\\"#tutorial\\\">",
    		ctx
    	});

    	return block;
    }

    // (16:8) <NavItem class="nav-item active">
    function create_default_slot_6(ctx) {
    	let navlink;
    	let current;

    	navlink = new NavLink({
    			props: {
    				href: "#tutorial",
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(navlink.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(navlink, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const navlink_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				navlink_changes.$$scope = { dirty, ctx };
    			}

    			navlink.$set(navlink_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navlink.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navlink.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navlink, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(16:8) <NavItem class=\\\"nav-item active\\\">",
    		ctx
    	});

    	return block;
    }

    // (20:11) <NavLink href="#intro">
    function create_default_slot_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Introduction");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(20:11) <NavLink href=\\\"#intro\\\">",
    		ctx
    	});

    	return block;
    }

    // (19:8) <NavItem class="nav-item active">
    function create_default_slot_4(ctx) {
    	let navlink;
    	let current;

    	navlink = new NavLink({
    			props: {
    				href: "#intro",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(navlink.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(navlink, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const navlink_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				navlink_changes.$$scope = { dirty, ctx };
    			}

    			navlink.$set(navlink_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navlink.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navlink.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navlink, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(19:8) <NavItem class=\\\"nav-item active\\\">",
    		ctx
    	});

    	return block;
    }

    // (23:10) <NavLink href="#top">
    function create_default_slot_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Home");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(23:10) <NavLink href=\\\"#top\\\">",
    		ctx
    	});

    	return block;
    }

    // (22:8) <NavItem class="nav-item active">
    function create_default_slot_2(ctx) {
    	let navlink;
    	let current;

    	navlink = new NavLink({
    			props: {
    				href: "#top",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(navlink.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(navlink, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const navlink_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				navlink_changes.$$scope = { dirty, ctx };
    			}

    			navlink.$set(navlink_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navlink.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navlink.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navlink, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(22:8) <NavItem class=\\\"nav-item active\\\">",
    		ctx
    	});

    	return block;
    }

    // (15:5) <Nav class="ms-auto mb-2 mb-lg-0">
    function create_default_slot_1(ctx) {
    	let navitem0;
    	let t0;
    	let navitem1;
    	let t1;
    	let navitem2;
    	let current;

    	navitem0 = new NavItem({
    			props: {
    				class: "nav-item active",
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	navitem1 = new NavItem({
    			props: {
    				class: "nav-item active",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	navitem2 = new NavItem({
    			props: {
    				class: "nav-item active",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(navitem0.$$.fragment);
    			t0 = space();
    			create_component(navitem1.$$.fragment);
    			t1 = space();
    			create_component(navitem2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(navitem0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(navitem1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(navitem2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const navitem0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				navitem0_changes.$$scope = { dirty, ctx };
    			}

    			navitem0.$set(navitem0_changes);
    			const navitem1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				navitem1_changes.$$scope = { dirty, ctx };
    			}

    			navitem1.$set(navitem1_changes);
    			const navitem2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				navitem2_changes.$$scope = { dirty, ctx };
    			}

    			navitem2.$set(navitem2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navitem0.$$.fragment, local);
    			transition_in(navitem1.$$.fragment, local);
    			transition_in(navitem2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navitem0.$$.fragment, local);
    			transition_out(navitem1.$$.fragment, local);
    			transition_out(navitem2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navitem0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(navitem1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(navitem2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(15:5) <Nav class=\\\"ms-auto mb-2 mb-lg-0\\\">",
    		ctx
    	});

    	return block;
    }

    // (7:2) <Navbar {color} class="fixed-top navbar-expand-lg navbar-light">
    function create_default_slot(ctx) {
    	let img;
    	let img_src_value;
    	let t;
    	let nav;
    	let current;

    	nav = new Nav({
    			props: {
    				class: "ms-auto mb-2 mb-lg-0",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			img = element("img");
    			t = space();
    			create_component(nav.$$.fragment);
    			attr_dev(img, "class", "NavbarBrand");
    			if (!src_url_equal(img.src, img_src_value = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Svelte_Logo.svg/1200px-Svelte_Logo.svg.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "href", "/");
    			attr_dev(img, "width", "1.5%");
    			attr_dev(img, "alt", "logo");
    			add_location(img, file, 7, 5, 189);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(nav, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const nav_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				nav_changes.$$scope = { dirty, ctx };
    			}

    			nav.$set(nav_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t);
    			destroy_component(nav, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(7:2) <Navbar {color} class=\\\"fixed-top navbar-expand-lg navbar-light\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let navbar;
    	let t0;
    	let header;
    	let div5;
    	let div4;
    	let div2;
    	let div1;
    	let h1;
    	let t2;
    	let p0;
    	let t3;
    	let br0;
    	let t4;
    	let t5;
    	let div0;
    	let a0;
    	let t7;
    	let div3;
    	let img0;
    	let img0_src_value;
    	let t8;
    	let section;
    	let div12;
    	let h30;
    	let t10;
    	let p1;
    	let t11;
    	let em0;
    	let t13;
    	let br1;
    	let t14;
    	let strong0;
    	let t16;
    	let strong1;
    	let t18;
    	let t19;
    	let p2;
    	let t20;
    	let em1;
    	let t22;
    	let strong2;
    	let em2;
    	let t24;
    	let strong3;
    	let t26;
    	let br2;
    	let t27;
    	let t28;
    	let p3;
    	let t30;
    	let h4;
    	let t32;
    	let div10;
    	let div6;
    	let img1;
    	let img1_src_value;
    	let t33;
    	let p4;
    	let a1;
    	let strong4;
    	let t35;
    	let t36;
    	let div7;
    	let img2;
    	let img2_src_value;
    	let t37;
    	let p5;
    	let a2;
    	let strong5;
    	let t39;
    	let t40;
    	let div8;
    	let img3;
    	let img3_src_value;
    	let t41;
    	let p6;
    	let a3;
    	let strong6;
    	let t43;
    	let t44;
    	let div9;
    	let img4;
    	let img4_src_value;
    	let t45;
    	let p7;
    	let a4;
    	let strong7;
    	let t47;
    	let t48;
    	let h31;
    	let t50;
    	let p8;
    	let t51;
    	let strong8;
    	let t53;
    	let strong9;
    	let t55;
    	let t56;
    	let p9;
    	let t58;
    	let iframe0;
    	let iframe0_src_value;
    	let t59;
    	let p10;
    	let t60;
    	let em3;
    	let t62;
    	let strong10;
    	let t64;
    	let t65;
    	let ul0;
    	let li0;
    	let strong11;
    	let t67;
    	let em4;
    	let t69;
    	let li1;
    	let strong12;
    	let t71;
    	let em5;
    	let t73;
    	let t74;
    	let iframe1;
    	let iframe1_src_value;
    	let t75;
    	let p11;
    	let t76;
    	let strong13;
    	let t78;
    	let t79;
    	let iframe2;
    	let iframe2_src_value;
    	let t80;
    	let p12;
    	let t81;
    	let em6;
    	let t83;
    	let iframe3;
    	let iframe3_src_value;
    	let t84;
    	let p13;
    	let t85;
    	let em7;
    	let t87;
    	let t88;
    	let ul1;
    	let li2;
    	let strong14;
    	let t90;
    	let t91;
    	let li3;
    	let strong15;
    	let t93;
    	let t94;
    	let li4;
    	let strong16;
    	let t96;
    	let t97;
    	let li5;
    	let strong17;
    	let t99;
    	let t100;
    	let iframe4;
    	let iframe4_src_value;
    	let t101;
    	let p14;
    	let t102;
    	let strong18;
    	let t104;
    	let strong19;
    	let t106;
    	let t107;
    	let iframe5;
    	let iframe5_src_value;
    	let t108;
    	let p15;
    	let t109;
    	let strong20;
    	let t111;
    	let t112;
    	let iframe6;
    	let iframe6_src_value;
    	let t113;
    	let p16;
    	let t114;
    	let strong21;
    	let t116;
    	let t117;
    	let iframe7;
    	let iframe7_src_value;
    	let t118;
    	let p17;
    	let t119;
    	let br3;
    	let t120;
    	let t121;
    	let div11;
    	let iframe8;
    	let iframe8_src_value;
    	let current;

    	navbar = new Navbar({
    			props: {
    				color,
    				class: "fixed-top navbar-expand-lg navbar-light",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			header = element("header");
    			div5 = element("div");
    			div4 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "SVELTE";
    			t2 = space();
    			p0 = element("p");
    			t3 = text("CYBERNETICALLY ENHANCED");
    			br0 = element("br");
    			t4 = text(" WEB APPS");
    			t5 = space();
    			div0 = element("div");
    			a0 = element("a");
    			a0.textContent = "Discover";
    			t7 = space();
    			div3 = element("div");
    			img0 = element("img");
    			t8 = space();
    			section = element("section");
    			div12 = element("div");
    			h30 = element("h3");
    			h30.textContent = "C'est quoi Svelte?";
    			t10 = space();
    			p1 = element("p");
    			t11 = text("Svelte est un outil permettant de créer des applications Web ");
    			em0 = element("em");
    			em0.textContent = "rapides";
    			t13 = text(". ");
    			br1 = element("br");
    			t14 = text("\n          \n          Il est similaire aux frameworks JavaScript tels que ");
    			strong0 = element("strong");
    			strong0.textContent = "React";
    			t16 = text(" et ");
    			strong1 = element("strong");
    			strong1.textContent = "Vue";
    			t18 = text(", qui partagent l'objectif de faciliter la création d'interfaces utilisateur interactives fluides.");
    			t19 = space();
    			p2 = element("p");
    			t20 = text("Mais il y a une différence ");
    			em1 = element("em");
    			em1.textContent = "cruciale";
    			t22 = text(" : Svelte convertit votre application en JavaScript idéal au moment de la ");
    			strong2 = element("strong");
    			em2 = element("em");
    			em2.textContent = "compilation";
    			t24 = text(", plutôt que d'interpréter le code de votre application au moment de l'");
    			strong3 = element("strong");
    			strong3.textContent = "exécution";
    			t26 = text(". ");
    			br2 = element("br");
    			t27 = text(" Cela fait une grande différence dans le temps de chargement des sites utilisant Svelte par rapport à ceux utilisant d'autres frameworks volumineux.");
    			t28 = space();
    			p3 = element("p");
    			p3.textContent = "Au lieu d'utiliser des techniques telles que la différenciation virtuelle du DOM, Svelte écrit du code qui met à jour chirurgicalement le DOM lorsque l'état de votre application change.";
    			t30 = space();
    			h4 = element("h4");
    			h4.textContent = "Svelte est aimé et utilisé par";
    			t32 = space();
    			div10 = element("div");
    			div6 = element("div");
    			img1 = element("img");
    			t33 = space();
    			p4 = element("p");
    			a1 = element("a");
    			strong4 = element("strong");
    			strong4.textContent = "Brave Search";
    			t35 = text(" - un moteur de recherche qui ne vous suit pas");
    			t36 = space();
    			div7 = element("div");
    			img2 = element("img");
    			t37 = space();
    			p5 = element("p");
    			a2 = element("a");
    			strong5 = element("strong");
    			strong5.textContent = "Chess.com";
    			t39 = text("  - le plus grand serveur d'échecs sur Internet");
    			t40 = space();
    			div8 = element("div");
    			img3 = element("img");
    			t41 = space();
    			p6 = element("p");
    			a3 = element("a");
    			strong6 = element("strong");
    			strong6.textContent = "Radiofrance.fr";
    			t43 = text(" - Écouter radio en ligne.");
    			t44 = space();
    			div9 = element("div");
    			img4 = element("img");
    			t45 = space();
    			p7 = element("p");
    			a4 = element("a");
    			strong7 = element("strong");
    			strong7.textContent = "The New York Times";
    			t47 = text(" - Quotidien américain basé à New York.");
    			t48 = space();
    			h31 = element("h3");
    			h31.textContent = "TicTacToe Tutoriel";
    			t50 = space();
    			p8 = element("p");
    			t51 = text("Pour montrer quelques fonctionnalités simples mais utiles de ");
    			strong8 = element("strong");
    			strong8.textContent = "Svelte";
    			t53 = text(", je voudrais vous guider à travers un mini projet\n           ");
    			strong9 = element("strong");
    			strong9.textContent = "\"TicTacToe\"";
    			t55 = text(", le jeu que nous connaissons tous\n           assez bien lorsque nous regardons des démos.");
    			t56 = space();
    			p9 = element("p");
    			p9.textContent = "Pour commencer, nous utiliserons degit pour cloner un modèle à partir du\n           référentiel Github de Svelte, puis installer les dépendances et serve l'application";
    			t58 = space();
    			iframe0 = element("iframe");
    			t59 = space();
    			p10 = element("p");
    			t60 = text("Prenez 30 secondes pour nettoyer le template ");
    			em3 = element("em");
    			em3.textContent = "Hello World";
    			t62 = text(" de Svelte. Dans le dossier ");
    			strong10 = element("strong");
    			strong10.textContent = "src";
    			t64 = text(" :");
    			t65 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			strong11 = element("strong");
    			strong11.textContent = "App.svelte";
    			t67 = text(" : supprimer tout sauf 3 balises de base \t");
    			em4 = element("em");
    			em4.textContent = "<script>, <main>, <style>";
    			t69 = space();
    			li1 = element("li");
    			strong12 = element("strong");
    			strong12.textContent = "main.js";
    			t71 = text(" : supprimer la propriété ");
    			em5 = element("em");
    			em5.textContent = "\"name\"";
    			t73 = text(" qui n'est plus utilisé");
    			t74 = space();
    			iframe1 = element("iframe");
    			t75 = space();
    			p11 = element("p");
    			t76 = text("A partir de maintenant, nous n'avons plus qu'à travailler sur notre ");
    			strong13 = element("strong");
    			strong13.textContent = "App.svelte";
    			t78 = text(" . Nous allons commencer par construire l'interface et ses gestionnaires au clic");
    			t79 = space();
    			iframe2 = element("iframe");
    			t80 = space();
    			p12 = element("p");
    			t81 = text("Maintenant, nous avons besoin de quelques CSS simples pour afficher la grille 3x3, directement dans la balise ");
    			em6 = element("em");
    			em6.textContent = "<style>";
    			t83 = space();
    			iframe3 = element("iframe");
    			t84 = space();
    			p13 = element("p");
    			t85 = text("Ensuite, initiez les variables nécessaires dans la balise ");
    			em7 = element("em");
    			em7.textContent = "<script>";
    			t87 = text(" :");
    			t88 = space();
    			ul1 = element("ul");
    			li2 = element("li");
    			strong14 = element("strong");
    			strong14.textContent = "buttons";
    			t90 = text(" : tableau pour stocker l'état actuel de la grille");
    			t91 = space();
    			li3 = element("li");
    			strong15 = element("strong");
    			strong15.textContent = "result";
    			t93 = text(" : stocker la chaîne d'annonce de gain");
    			t94 = space();
    			li4 = element("li");
    			strong16 = element("strong");
    			strong16.textContent = "turn";
    			t96 = text(" : mémoriser le joueur suivant");
    			t97 = space();
    			li5 = element("li");
    			strong17 = element("strong");
    			strong17.textContent = "winCombinations";
    			t99 = text(" : cases qui doivent être remplies par le même joueur pour qu'il soit considéré comme vainqueur");
    			t100 = space();
    			iframe4 = element("iframe");
    			t101 = space();
    			p14 = element("p");
    			t102 = text("Il est temps d'écrire la fonction ");
    			strong18 = element("strong");
    			strong18.textContent = "setValue";
    			t104 = text(". Nous devons vérifier s'il y a quelqu'un qui a déjà joué sur la case cliquée, puis donner le tour actuel au bon joueur, vérifier s'il reste des coups à jouer et appeler ");
    			strong19 = element("strong");
    			strong19.textContent = "checkWinner()";
    			t106 = text(" pour vérifier si la partie est gagnée après le coup.");
    			t107 = space();
    			iframe5 = element("iframe");
    			t108 = space();
    			p15 = element("p");
    			t109 = text("Presque là. Voici ");
    			strong20 = element("strong");
    			strong20.textContent = "checkWinner()";
    			t111 = text(" la partie la plus importante de notre jeu, la validation du gagnant. Nous le publierons si le jeu est gagné.");
    			t112 = space();
    			iframe6 = element("iframe");
    			t113 = space();
    			p16 = element("p");
    			t114 = text("Et enfin, réinitialisez le jeu avec ");
    			strong21 = element("strong");
    			strong21.textContent = "restart()";
    			t116 = text(" s'il s'est terminé par un match nul ou si nous avons trouvé un gagnant !");
    			t117 = space();
    			iframe7 = element("iframe");
    			t118 = space();
    			p17 = element("p");
    			t119 = text("En gros, c'est ça ! ");
    			br3 = element("br");
    			t120 = text("\n        Vous avez un jeu de Tic Tac Toe jouable fonctionnel ;)");
    			t121 = space();
    			div11 = element("div");
    			iframe8 = element("iframe");
    			attr_dev(h1, "class", "display-1 fw-bold pt-5 text-white mb-4 font-monospace");
    			set_style(h1, "letter-spacing", "20px");
    			add_location(h1, file, 31, 17, 1078);
    			add_location(br0, file, 41, 43, 1494);
    			attr_dev(p0, "class", "lead fw-normal text-light mb-5 font-monospace");
    			set_style(p0, "letter-spacing", "3px");
    			add_location(p0, file, 37, 17, 1303);
    			attr_dev(a0, "class", "btn btn-secondary btn-lg text-white px-4 me-sm-3");
    			attr_dev(a0, "href", "#intro");
    			add_location(a0, file, 46, 20, 1698);
    			attr_dev(div0, "class", "d-grid gap-3 d-sm-flex justify-content-sm-center justify-content-xl-start");
    			add_location(div0, file, 43, 17, 1549);
    			attr_dev(div1, "class", "my-5 text-center text-xl-start");
    			add_location(div1, file, 30, 14, 1016);
    			attr_dev(div2, "class", "col-lg-8 col-xl-7 col-xxl-6");
    			add_location(div2, file, 29, 11, 960);
    			attr_dev(img0, "class", "img-fluid rounded-3 my-5");
    			if (!src_url_equal(img0.src, img0_src_value = "https://svelte.dev/images/twitter-thumbnail.jpg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Svelte illustration");
    			attr_dev(img0, "width", "60%");
    			add_location(img0, file, 54, 14, 2006);
    			attr_dev(div3, "class", "col-xl-5 col-xxl-6 d-none d-xl-block text-center");
    			add_location(div3, file, 53, 11, 1929);
    			attr_dev(div4, "class", "row gx-5 align-items-center justify-content-center");
    			add_location(div4, file, 28, 8, 884);
    			attr_dev(div5, "class", "container px-4");
    			add_location(div5, file, 27, 5, 847);
    			attr_dev(header, "class", "bg-dark py-5");
    			add_location(header, file, 26, 2, 812);
    			attr_dev(h30, "id", "intro");
    			attr_dev(h30, "class", "svelte-lhzpbj");
    			add_location(h30, file, 66, 8, 2346);
    			add_location(em0, file, 67, 72, 2457);
    			add_location(br1, file, 67, 90, 2475);
    			add_location(strong0, file, 69, 62, 2553);
    			add_location(strong1, file, 69, 88, 2579);
    			add_location(p1, file, 67, 8, 2393);
    			add_location(em1, file, 71, 38, 2750);
    			add_location(em2, file, 71, 137, 2849);
    			add_location(strong2, file, 71, 129, 2841);
    			add_location(strong3, file, 71, 237, 2949);
    			add_location(br2, file, 71, 265, 2977);
    			add_location(p2, file, 71, 8, 2720);
    			add_location(p3, file, 72, 8, 3142);
    			add_location(h4, file, 74, 8, 3344);
    			attr_dev(img1, "width", "90%");
    			if (!src_url_equal(img1.src, img1_src_value = "https://i.imgur.com/06Tta8T.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "brave search site");
    			attr_dev(img1, "class", "svelte-lhzpbj");
    			add_location(img1, file, 77, 12, 3465);
    			add_location(strong4, file, 78, 64, 3607);
    			attr_dev(a1, "href", "https://search.brave.com/");
    			add_location(a1, file, 78, 28, 3571);
    			attr_dev(p4, "class", "mt-3");
    			add_location(p4, file, 78, 12, 3555);
    			attr_dev(div6, "class", "customer svelte-lhzpbj");
    			add_location(div6, file, 76, 10, 3430);
    			attr_dev(img2, "width", "90%");
    			if (!src_url_equal(img2.src, img2_src_value = "https://i.imgur.com/vRq5Ltl.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "chess.com site");
    			attr_dev(img2, "class", "svelte-lhzpbj");
    			add_location(img2, file, 81, 12, 3753);
    			add_location(strong5, file, 82, 57, 3885);
    			attr_dev(a2, "href", "https://chess.com/");
    			add_location(a2, file, 82, 28, 3856);
    			attr_dev(p5, "class", "mt-3");
    			add_location(p5, file, 82, 12, 3840);
    			attr_dev(div7, "class", "customer svelte-lhzpbj");
    			add_location(div7, file, 80, 10, 3718);
    			attr_dev(img3, "width", "90%");
    			if (!src_url_equal(img3.src, img3_src_value = "https://i.imgur.com/myfGGcT.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "radiofrance site");
    			attr_dev(img3, "class", "svelte-lhzpbj");
    			add_location(img3, file, 85, 12, 4029);
    			add_location(strong6, file, 86, 66, 4172);
    			attr_dev(a3, "href", "https://www.radiofrance.fr/");
    			add_location(a3, file, 86, 28, 4134);
    			attr_dev(p6, "class", "mt-3");
    			add_location(p6, file, 86, 12, 4118);
    			attr_dev(div8, "class", "customer svelte-lhzpbj");
    			add_location(div8, file, 84, 10, 3994);
    			attr_dev(img4, "width", "90%");
    			if (!src_url_equal(img4.src, img4_src_value = "https://i.imgur.com/KtqMyFq.png")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "the new york times site");
    			attr_dev(img4, "class", "svelte-lhzpbj");
    			add_location(img4, file, 89, 12, 4300);
    			add_location(strong7, file, 90, 64, 4448);
    			attr_dev(a4, "href", "https://www.nytimes.com/");
    			add_location(a4, file, 90, 29, 4413);
    			attr_dev(p7, "class", "mt-3 ");
    			add_location(p7, file, 90, 12, 4396);
    			attr_dev(div9, "class", "customer svelte-lhzpbj");
    			add_location(div9, file, 88, 10, 4265);
    			attr_dev(div10, "class", "customer-grid svelte-lhzpbj");
    			add_location(div10, file, 75, 8, 3392);
    			attr_dev(h31, "id", "tutorial");
    			attr_dev(h31, "class", "svelte-lhzpbj");
    			add_location(h31, file, 96, 8, 4586);
    			add_location(strong8, file, 98, 72, 4712);
    			add_location(strong9, file, 101, 11, 4827);
    			add_location(p8, file, 97, 8, 4636);
    			add_location(p9, file, 104, 8, 4967);
    			attr_dev(iframe0, "title", "init.sh");
    			attr_dev(iframe0, "width", "100%");
    			attr_dev(iframe0, "height", "160");
    			if (!src_url_equal(iframe0.src, iframe0_src_value = "data:text/html;charset=utf-8,\n           <head><base target='_blank' /></head>\n           <body><script src='https://gist.github.com/laamphan/3b91e0171c80c3f629f1811b8b427057.js'></script>\n           </body>")) attr_dev(iframe0, "src", iframe0_src_value);
    			add_location(iframe0, file, 108, 8, 5171);
    			add_location(em3, file, 115, 56, 5526);
    			add_location(strong10, file, 115, 104, 5574);
    			add_location(p10, file, 115, 8, 5478);
    			add_location(strong11, file, 117, 12, 5626);
    			add_location(em4, file, 117, 81, 5695);
    			add_location(li0, file, 117, 8, 5622);
    			add_location(strong12, file, 118, 12, 5766);
    			add_location(em5, file, 118, 62, 5816);
    			add_location(li1, file, 118, 8, 5762);
    			add_location(ul0, file, 116, 8, 5609);
    			attr_dev(iframe1, "title", "clean");
    			attr_dev(iframe1, "width", "100%");
    			attr_dev(iframe1, "height", "450");
    			if (!src_url_equal(iframe1.src, iframe1_src_value = "data:text/html;charset=utf-8,\n           <head><base target='_blank' /></head>\n           <body><script src='https://gist.github.com/laamphan/997d95bb9268c5857f377be29be83b36.js'></script>\n           </body>")) attr_dev(iframe1, "src", iframe1_src_value);
    			add_location(iframe1, file, 120, 8, 5882);
    			add_location(strong13, file, 127, 79, 6258);
    			add_location(p11, file, 127, 8, 6187);
    			attr_dev(iframe2, "title", "main");
    			attr_dev(iframe2, "width", "100%");
    			attr_dev(iframe2, "height", "420");
    			if (!src_url_equal(iframe2.src, iframe2_src_value = "data:text/html;charset=utf-8,\n        <head><base target='_blank' /></head>\n        <body><script src='https://gist.github.com/laamphan/5cee2a805ee54ad0ecf3eb16ab09b786.js'></script>\n        </body>")) attr_dev(iframe2, "src", iframe2_src_value);
    			add_location(iframe2, file, 128, 8, 6378);
    			add_location(em6, file, 135, 121, 6777);
    			add_location(p12, file, 135, 8, 6664);
    			attr_dev(iframe3, "title", "main");
    			attr_dev(iframe3, "width", "100%");
    			attr_dev(iframe3, "height", "350");
    			if (!src_url_equal(iframe3.src, iframe3_src_value = "data:text/html;charset=utf-8,\n        <head><base target='_blank' /></head>\n        <body><script src='https://gist.github.com/laamphan/a5b1e352cf04039a9e57b38433d04d29.js'></script>\n        </body>")) attr_dev(iframe3, "src", iframe3_src_value);
    			add_location(iframe3, file, 136, 8, 6812);
    			add_location(em7, file, 143, 69, 7159);
    			add_location(p13, file, 143, 8, 7098);
    			add_location(strong14, file, 145, 14, 7219);
    			add_location(li2, file, 145, 10, 7215);
    			add_location(strong15, file, 146, 14, 7313);
    			add_location(li3, file, 146, 10, 7309);
    			add_location(strong16, file, 147, 14, 7395);
    			add_location(li4, file, 147, 10, 7391);
    			add_location(strong17, file, 148, 14, 7466);
    			add_location(li5, file, 148, 10, 7462);
    			add_location(ul1, file, 144, 10, 7200);
    			attr_dev(iframe4, "title", "main");
    			attr_dev(iframe4, "width", "100%");
    			attr_dev(iframe4, "height", "400");
    			if (!src_url_equal(iframe4.src, iframe4_src_value = "data:text/html;charset=utf-8,\n        <head><base target='_blank' /></head>\n        <body><script src='https://gist.github.com/laamphan/5ef08bc8ef0782b4bd2b31419d97f14d.js'></script>\n        </body>")) attr_dev(iframe4, "src", iframe4_src_value);
    			add_location(iframe4, file, 150, 8, 7621);
    			add_location(strong18, file, 157, 45, 7944);
    			add_location(strong19, file, 157, 240, 8139);
    			add_location(p14, file, 157, 8, 7907);
    			attr_dev(iframe5, "title", "main");
    			attr_dev(iframe5, "width", "100%");
    			attr_dev(iframe5, "height", "350");
    			if (!src_url_equal(iframe5.src, iframe5_src_value = "data:text/html;charset=utf-8,\n        <head><base target='_blank' /></head>\n        <body><script src='https://gist.github.com/laamphan/56fc22148582d23cba8447edacfb8d80.js'></script>\n        </body>")) attr_dev(iframe5, "src", iframe5_src_value);
    			add_location(iframe5, file, 158, 8, 8235);
    			add_location(strong20, file, 165, 29, 8542);
    			add_location(p15, file, 165, 8, 8521);
    			attr_dev(iframe6, "title", "main");
    			attr_dev(iframe6, "width", "100%");
    			attr_dev(iframe6, "height", "350");
    			if (!src_url_equal(iframe6.src, iframe6_src_value = "data:text/html;charset=utf-8,\n        <head><base target='_blank' /></head>\n        <body><script src='https://gist.github.com/laamphan/f37c737705713e8b40c90f05a8bc0d62.js'></script>\n        </body>")) attr_dev(iframe6, "src", iframe6_src_value);
    			add_location(iframe6, file, 166, 8, 8694);
    			add_location(strong21, file, 173, 47, 9019);
    			add_location(p16, file, 173, 8, 8980);
    			attr_dev(iframe7, "title", "main");
    			attr_dev(iframe7, "width", "100%");
    			attr_dev(iframe7, "height", "180");
    			if (!src_url_equal(iframe7.src, iframe7_src_value = "data:text/html;charset=utf-8,\n        <head><base target='_blank' /></head>\n        <body><script src='https://gist.github.com/laamphan/14ff189164cfc935dd2439c6d9d37a70.js'></script>\n        </body>")) attr_dev(iframe7, "src", iframe7_src_value);
    			add_location(iframe7, file, 174, 8, 9131);
    			add_location(br3, file, 181, 31, 9440);
    			add_location(p17, file, 181, 8, 9417);
    			if (!src_url_equal(iframe8.src, iframe8_src_value = "https://codesandbox.io/embed/tictactoe-6kx5mh?fontsize=12&hidenavigation=1&module=%2FApp.svelte&theme=dark&view=split&hidedevtools=1")) attr_dev(iframe8, "src", iframe8_src_value);
    			set_style(iframe8, "width", "100%");
    			set_style(iframe8, "height", "500px");
    			set_style(iframe8, "border", "0");
    			set_style(iframe8, "border-radius", "4px");
    			set_style(iframe8, "overflow", "hidden");
    			attr_dev(iframe8, "title", "TicTacToe");
    			attr_dev(iframe8, "allow", "accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking");
    			attr_dev(iframe8, "sandbox", "allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts");
    			add_location(iframe8, file, 184, 8, 9551);
    			attr_dev(div11, "id", "codesandbox");
    			add_location(div11, file, 183, 8, 9520);
    			attr_dev(div12, "class", "blog-post");
    			add_location(div12, file, 65, 5, 2314);
    			attr_dev(section, "class", "content svelte-lhzpbj");
    			add_location(section, file, 64, 2, 2283);
    			add_location(main, file, 5, 0, 110);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(navbar, main, null);
    			append_dev(main, t0);
    			append_dev(main, header);
    			append_dev(header, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			append_dev(div2, div1);
    			append_dev(div1, h1);
    			append_dev(div1, t2);
    			append_dev(div1, p0);
    			append_dev(p0, t3);
    			append_dev(p0, br0);
    			append_dev(p0, t4);
    			append_dev(div1, t5);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(div4, t7);
    			append_dev(div4, div3);
    			append_dev(div3, img0);
    			append_dev(main, t8);
    			append_dev(main, section);
    			append_dev(section, div12);
    			append_dev(div12, h30);
    			append_dev(div12, t10);
    			append_dev(div12, p1);
    			append_dev(p1, t11);
    			append_dev(p1, em0);
    			append_dev(p1, t13);
    			append_dev(p1, br1);
    			append_dev(p1, t14);
    			append_dev(p1, strong0);
    			append_dev(p1, t16);
    			append_dev(p1, strong1);
    			append_dev(p1, t18);
    			append_dev(div12, t19);
    			append_dev(div12, p2);
    			append_dev(p2, t20);
    			append_dev(p2, em1);
    			append_dev(p2, t22);
    			append_dev(p2, strong2);
    			append_dev(strong2, em2);
    			append_dev(p2, t24);
    			append_dev(p2, strong3);
    			append_dev(p2, t26);
    			append_dev(p2, br2);
    			append_dev(p2, t27);
    			append_dev(div12, t28);
    			append_dev(div12, p3);
    			append_dev(div12, t30);
    			append_dev(div12, h4);
    			append_dev(div12, t32);
    			append_dev(div12, div10);
    			append_dev(div10, div6);
    			append_dev(div6, img1);
    			append_dev(div6, t33);
    			append_dev(div6, p4);
    			append_dev(p4, a1);
    			append_dev(a1, strong4);
    			append_dev(p4, t35);
    			append_dev(div10, t36);
    			append_dev(div10, div7);
    			append_dev(div7, img2);
    			append_dev(div7, t37);
    			append_dev(div7, p5);
    			append_dev(p5, a2);
    			append_dev(a2, strong5);
    			append_dev(p5, t39);
    			append_dev(div10, t40);
    			append_dev(div10, div8);
    			append_dev(div8, img3);
    			append_dev(div8, t41);
    			append_dev(div8, p6);
    			append_dev(p6, a3);
    			append_dev(a3, strong6);
    			append_dev(p6, t43);
    			append_dev(div10, t44);
    			append_dev(div10, div9);
    			append_dev(div9, img4);
    			append_dev(div9, t45);
    			append_dev(div9, p7);
    			append_dev(p7, a4);
    			append_dev(a4, strong7);
    			append_dev(p7, t47);
    			append_dev(div12, t48);
    			append_dev(div12, h31);
    			append_dev(div12, t50);
    			append_dev(div12, p8);
    			append_dev(p8, t51);
    			append_dev(p8, strong8);
    			append_dev(p8, t53);
    			append_dev(p8, strong9);
    			append_dev(p8, t55);
    			append_dev(div12, t56);
    			append_dev(div12, p9);
    			append_dev(div12, t58);
    			append_dev(div12, iframe0);
    			append_dev(div12, t59);
    			append_dev(div12, p10);
    			append_dev(p10, t60);
    			append_dev(p10, em3);
    			append_dev(p10, t62);
    			append_dev(p10, strong10);
    			append_dev(p10, t64);
    			append_dev(div12, t65);
    			append_dev(div12, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, strong11);
    			append_dev(li0, t67);
    			append_dev(li0, em4);
    			append_dev(ul0, t69);
    			append_dev(ul0, li1);
    			append_dev(li1, strong12);
    			append_dev(li1, t71);
    			append_dev(li1, em5);
    			append_dev(li1, t73);
    			append_dev(div12, t74);
    			append_dev(div12, iframe1);
    			append_dev(div12, t75);
    			append_dev(div12, p11);
    			append_dev(p11, t76);
    			append_dev(p11, strong13);
    			append_dev(p11, t78);
    			append_dev(div12, t79);
    			append_dev(div12, iframe2);
    			append_dev(div12, t80);
    			append_dev(div12, p12);
    			append_dev(p12, t81);
    			append_dev(p12, em6);
    			append_dev(div12, t83);
    			append_dev(div12, iframe3);
    			append_dev(div12, t84);
    			append_dev(div12, p13);
    			append_dev(p13, t85);
    			append_dev(p13, em7);
    			append_dev(p13, t87);
    			append_dev(div12, t88);
    			append_dev(div12, ul1);
    			append_dev(ul1, li2);
    			append_dev(li2, strong14);
    			append_dev(li2, t90);
    			append_dev(ul1, t91);
    			append_dev(ul1, li3);
    			append_dev(li3, strong15);
    			append_dev(li3, t93);
    			append_dev(ul1, t94);
    			append_dev(ul1, li4);
    			append_dev(li4, strong16);
    			append_dev(li4, t96);
    			append_dev(ul1, t97);
    			append_dev(ul1, li5);
    			append_dev(li5, strong17);
    			append_dev(li5, t99);
    			append_dev(div12, t100);
    			append_dev(div12, iframe4);
    			append_dev(div12, t101);
    			append_dev(div12, p14);
    			append_dev(p14, t102);
    			append_dev(p14, strong18);
    			append_dev(p14, t104);
    			append_dev(p14, strong19);
    			append_dev(p14, t106);
    			append_dev(div12, t107);
    			append_dev(div12, iframe5);
    			append_dev(div12, t108);
    			append_dev(div12, p15);
    			append_dev(p15, t109);
    			append_dev(p15, strong20);
    			append_dev(p15, t111);
    			append_dev(div12, t112);
    			append_dev(div12, iframe6);
    			append_dev(div12, t113);
    			append_dev(div12, p16);
    			append_dev(p16, t114);
    			append_dev(p16, strong21);
    			append_dev(p16, t116);
    			append_dev(div12, t117);
    			append_dev(div12, iframe7);
    			append_dev(div12, t118);
    			append_dev(div12, p17);
    			append_dev(p17, t119);
    			append_dev(p17, br3);
    			append_dev(p17, t120);
    			append_dev(div12, t121);
    			append_dev(div12, div11);
    			append_dev(div11, iframe8);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const navbar_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				navbar_changes.$$scope = { dirty, ctx };
    			}

    			navbar.$set(navbar_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navbar);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const color = "white";

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Navbar, Nav, NavItem, NavLink, color });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
