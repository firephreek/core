/**
 * Disable console output unless DEBUG mode is enabled.
 * Add
 *      'debug' => true,
 * To the definition of $CONFIG in config/config.php to enable debug mode.
 * The undefined checks fix the broken ie8 console
 */

/* global oc_isadmin */

var oc_debug;
var oc_webroot;

var oc_requesttoken = document.getElementsByTagName('head')[0].getAttribute('data-requesttoken');

window.oc_config = window.oc_config || {};

if (typeof oc_webroot === "undefined") {
	oc_webroot = location.pathname;
	var pos = oc_webroot.indexOf('/index.php/');
	if (pos !== -1) {
		oc_webroot = oc_webroot.substr(0, pos);
	}
	else {
		oc_webroot = oc_webroot.substr(0, oc_webroot.lastIndexOf('/'));
	}
}

/**
 * Sanitizes a HTML string by replacing all potential dangerous characters with HTML entities
 * @param {string} s String to sanitize
 * @return {string} Sanitized string
 */
function escapeHTML(s) {
	return s.toString().split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;').split('\'').join('&#039;');
}

/**
 * Get the path to download a file
 * @param {string} file The filename
 * @param {string} dir The directory the file is in - e.g. $('#dir').val()
 * @return {string} Path to download the file
 * @deprecated use Files.getDownloadURL() instead
 */
function fileDownloadPath(dir, file) {
	return OC.filePath('files', 'ajax', 'download.php') + '?files=' + encodeURIComponent(file) + '&dir=' + encodeURIComponent(dir);
}

/** @namespace */
var OC = {
	PERMISSION_CREATE: 4,
	PERMISSION_READ: 1,
	PERMISSION_UPDATE: 2,
	PERMISSION_DELETE: 8,
	PERMISSION_SHARE: 16,
	PERMISSION_ALL: 31,
	TAG_FAVORITE: '_$!<Favorite>!$_',
	/* jshint camelcase: false */
	/**
	 * Relative path to ownCloud root.
	 * For example: "/owncloud"
	 *
	 * @type string
	 *
	 * @deprecated since 8.2, use OC.getRootPath() instead
	 * @see OC#getRootPath
	 */
	webroot: oc_webroot,

	/**
	 * Capabilities
	 *
	 * @type array
	 */
	_capabilities: window.oc_capabilities || null,

	_user: window.oc_user || null,

	appswebroots: (typeof oc_appswebroots !== 'undefined') ? oc_appswebroots : false,
	/**
	 * Currently logged in user or null if none
	 *
	 * @type String
	 * @deprecated use {@link OC.getCurrentUser} instead
	 */
	currentUser: (typeof oc_user !== 'undefined') ? oc_user.uid : false,
	config: window.oc_config,
	appConfig: window.oc_appconfig || {},
	theme: window.oc_defaults || {},
	coreApps: ['', 'admin', 'log', 'core/search', 'settings', 'core', '3rdparty'],
	requestToken: oc_requesttoken,
	menuSpeed: 50,
	currentTheme: window.theme || {},

	/**
	 * Get an absolute url to a file in an app
	 * @param {string} app the id of the app the file belongs to
	 * @param {string} file the file path relative to the app folder
	 * @return {string} Absolute URL to a file
	 */
	linkTo: function (app, file) {
		return OC.filePath(app, '', file);
	},

	/**
	 * Creates a relative url for remote use
	 * @param {string} service id
	 * @return {string} the url
	 */
	linkToRemoteBase: function (service) {
		return OC.getRootPath() + '/remote.php/' + service;
	},

	/**
	 * @brief Creates an absolute url for remote use
	 * @param {string} service id
	 * @return {string} the url
	 */
	linkToRemote: function (service) {
		return window.location.protocol + '//' + window.location.host + OC.linkToRemoteBase(service);
	},

	/**
	 * Gets the base path for the given OCS API service.
	 * @param {string} service name
	 * @param {int} version OCS API version
	 * @return {string} OCS API base path
	 */
	linkToOCS: function (service, version) {
		version = (version !== 2) ? 1 : 2;
		return OC.getProtocol() + '://' + OC.getHost() + OC.getRootPath() + '/ocs/v' + version + '.php/' + service + '/';
	},

	/**
	 * Generates the absolute url for the given relative url, which can contain parameters.
	 * Parameters will be URL encoded automatically.
	 * @param {string} url
	 * @param [params] params
	 * @param [options] options
	 * @param {bool} [options.escape=true] enable/disable auto escape of placeholders (by default enabled)
	 * @return {string} Absolute URL for the given relative URL
	 */
	generateUrl: function (url, params, options) {
		var defaultOptions = {
				escape: true
			},
			allOptions = options || {};
		_.defaults(allOptions, defaultOptions);

		var _build = function (text, vars) {
			var vars = vars || [];
			return text.replace(/{([^{}]*)}/g,
				function (a, b) {
					var r = (vars[b]);
					if (allOptions.escape) {
						return (typeof r === 'string' || typeof r === 'number') ? encodeURIComponent(r) : encodeURIComponent(a);
					} else {
						return (typeof r === 'string' || typeof r === 'number') ? r : a;
					}
				}
			);
		};
		if (url.charAt(0) !== '/') {
			url = '/' + url;

		}

		var webRoot = OC.getRootPath();
		if (oc_config.modRewriteWorking == true) {
			return webRoot + _build(url, params);
		}

		return webRoot + '/index.php' + _build(url, params);
	},

	/**
	 * Get the absolute url for a file in an app
	 * @param {string} app the id of the app
	 * @param {string} type the type of the file to link to (e.g. css,img,ajax.template)
	 * @param {string} file the filename
	 * @return {string} Absolute URL for a file in an app
	 */
	filePath: function (app, type, file) {
		var isCore = OC.coreApps.indexOf(app) !== -1,
			link = OC.getRootPath();
		if (file.substring(file.length - 3) === 'php' && !isCore) {
			link += '/index.php/apps/' + app;
			if (file != 'index.php') {
				link += '/';
				if (type) {
					link += encodeURI(type + '/');
				}
				link += file;
			}
		} else if (file.substring(file.length - 3) !== 'php' && !isCore) {
			link = OC.appswebroots[app];
			if (type) {
				link += '/' + type + '/';
			}
			if (link.substring(link.length - 1) !== '/') {
				link += '/';
			}
			link += file;
		} else {
			if ((app == 'settings' || app == 'core' || app == 'search') && type == 'ajax') {
				link += '/index.php/';
			}
			else {
				link += '/';
			}
			if (!isCore) {
				link += 'apps/';
			}
			if (app !== '') {
				app += '/';
				link += app;
			}
			if (type) {
				link += type + '/';
			}
			link += file;
		}
		return link;
	},

    /**
     * Check if a user file is allowed to be handled.
     * @param {string} file to check
     */
	fileIsBlacklisted: function(file) {
		return !!(file.match(oc_config.blacklist_files_regex));
	},

	/**
	 * Redirect to the target URL, can also be used for downloads.
	 * @param {string} targetURL URL to redirect to
	 */
	redirect: function (targetURL) {
		window.location = targetURL;
	},

	/**
	 * Reloads the current page
	 */
	reload: function () {
		window.location.reload();
	},

	/**
	 * Protocol that is used to access this ownCloud instance
	 * @return {string} Used protocol
	 */
	getProtocol: function () {
		return window.location.protocol.split(':')[0];
	},

	/**
	 * Returns the host used to access this ownCloud instance
	 * Host is sometimes the same as the hostname but now always.
	 *
	 * Examples:
	 * http://example.com => example.com
	 * https://example.com => example.com
	 * http://example.com:8080 => example.com:8080
	 *
	 * @return {string} host
	 *
	 * @since 8.2
	 */
	getHost: function () {
		return window.location.host;
	},

	/**
	 * Returns the hostname used to access this ownCloud instance
	 * The hostname is always stripped of the port
	 *
	 * @return {string} hostname
	 * @since 9.0
	 */
	getHostName: function () {
		return window.location.hostname;
	},

	/**
	 * Returns the port number used to access this ownCloud instance
	 *
	 * @return {int} port number
	 *
	 * @since 8.2
	 */
	getPort: function () {
		return window.location.port;
	},

	/**
	 * Returns the web root path where this ownCloud instance
	 * is accessible, with a leading slash.
	 * For example "/owncloud".
	 *
	 * @return {string} web root path
	 *
	 * @since 8.2
	 */
	getRootPath: function () {
		return OC.webroot;
	},

	/**
	 * Returns the capabilities
	 *
	 * @return {array} capabilities
	 */
	getCapabilities: function() {
		return OC._capabilities;
	},

	/**
	 * Returns the currently logged in user or null if there is no logged in
	 * user (public page mode)
	 *
	 * @return {OC.CurrentUser} user spec
	 * @since 9.0.0
	 */
	getCurrentUser: function () {
		if (OC._user !== null) {
			return oc_user;
		}
		return {
			uid: null,
			displayName: null,
			email: null,
			groups: [],
		};
	},

	/**
	 * get the absolute path to an image file
	 * if no extension is given for the image, it will automatically decide
	 * between .png and .svg based on what the browser supports
	 * @param {string} app the app id to which the image belongs
	 * @param {string} file the name of the image file
	 * @return {string}
	 */
	imagePath: function (app, file) {
		if (file.indexOf('.') == -1) {//if no extension is given, use svg
			file += '.svg';
		}
		return OC.filePath(app, 'img', file);
	},

	/**
	 * URI-Encodes a file path but keep the path slashes.
	 *
	 * @param path path
	 * @return encoded path
	 */
	encodePath: function (path) {
		if (!path) {
			return path;
		}
		var parts = path.split('/');
		var result = [];
		for (var i = 0; i < parts.length; i++) {
			result.push(encodeURIComponent(parts[i]));
		}
		return result.join('/');
	},

	/**
	 * Load a script for the server and load it. If the script is already loaded,
	 * the event handler will be called directly
	 * @param {string} app the app id to which the script belongs
	 * @param {string} script the filename of the script
	 * @param ready event handler to be called when the script is loaded
	 */
	addScript: function (app, script, ready) {
		var deferred, path = OC.filePath(app, 'js', script + '.js');
		if (!OC.addScript.loaded[path]) {
			if (ready) {
				deferred = $.getScript(path, ready);
			} else {
				deferred = $.getScript(path);
			}
			OC.addScript.loaded[path] = deferred;
		} else {
			if (ready) {
				ready();
			}
		}
		return OC.addScript.loaded[path];
	},
	/**
	 * Loads a CSS file
	 * @param {string} app the app id to which the css style belongs
	 * @param {string} style the filename of the css file
	 */
	addStyle: function (app, style) {
		var path = OC.filePath(app, 'css', style + '.css');
		if (OC.addStyle.loaded.indexOf(path) === -1) {
			OC.addStyle.loaded.push(path);
			if (document.createStyleSheet) {
				document.createStyleSheet(path);
			} else {
				style = $('<link rel="stylesheet" type="text/css" href="' + path + '"/>');
				$('head').append(style);
			}
		}
	},

	/**
	 * Loads translations for the given app asynchronously.
	 *
	 * @param {String} app app name
	 * @param {Function} callback callback to call after loading
	 * @return {Promise}
	 */
	addTranslations: function (app, callback) {
		return OC.L10N.load(app, callback);
	},

	/**
	 * Returns the base name of the given path.
	 * For example for "/abc/somefile.txt" it will return "somefile.txt"
	 *
	 * @param {String} path
	 * @return {String} base name
	 */
	basename: function (path) {
		return path.replace(/\\/g, '/').replace(/.*\//, '');
	},

	/**
	 * Returns true if the email regexp matches the email address else false returned
	 * For example if email is "abc@foo.com", it will return true.
	 * If email address is "abc@foo.c", then false will be returned.
	 *
	 * @param emailAddress
	 * @returns {boolean}
	 *
	 * @since 10.1.0
	 */
	validateEmail: function(emailAddress) {
		var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@\.]{2,}$/;
		return (emailRegex.exec(emailAddress) !== null);
	},

	/**
	 * Returns the dir name of the given path.
	 * For example for "/abc/somefile.txt" it will return "/abc"
	 *
	 * @param {String} path
	 * @return {String} dir name
	 */
	dirname: function (path) {
		return path.replace(/\\/g, '/').replace(/\/[^\/]*$/, '');
	},

	/**
	 * Returns whether the given paths are the same, without
	 * leading, trailing or doubled slashes and also removing
	 * the dot sections.
	 *
	 * @param {String} path1 first path
	 * @param {String} path2 second path
	 * @return {bool} true if the paths are the same
	 *
	 * @since 9.0
	 */
	isSamePath: function (path1, path2) {
		var filterDot = function (p) {
			return p !== '.';
		};
		var pathSections1 = _.filter((path1 || '').split('/'), filterDot);
		var pathSections2 = _.filter((path2 || '').split('/'), filterDot);
		path1 = OC.joinPaths.apply(OC, pathSections1);
		path2 = OC.joinPaths.apply(OC, pathSections2);
		return path1 === path2;
	},

	/**
	 * Join path sections
	 *
	 * @param {...String} path sections
	 *
	 * @return {String} joined path, any leading or trailing slash
	 * will be kept
	 *
	 * @since 8.2
	 */
	joinPaths: function () {
		if (arguments.length < 1) {
			return '';
		}
		var path = '';
		// convert to array
		var args = Array.prototype.slice.call(arguments);
		// discard empty arguments
		args = _.filter(args, function (arg) {
			return arg.length > 0;
		});
		if (args.length < 1) {
			return '';
		}

		var lastArg = args[args.length - 1];
		var leadingSlash = args[0].charAt(0) === '/';
		var trailingSlash = lastArg.charAt(lastArg.length - 1) === '/';
		var sections = [];
		var i;
		for (i = 0; i < args.length; i++) {
			sections = sections.concat(args[i].split('/'));
		}
		var first = !leadingSlash;
		for (i = 0; i < sections.length; i++) {
			if (sections[i] !== '') {
				if (first) {
					first = false;
				} else {
					path += '/';
				}
				path += sections[i];
			}
		}

		if (trailingSlash) {
			// add it back
			path += '/';
		}
		return path;
	},

	/**
	 * Do a search query and display the results
	 * @param {string} query the search query
	 */
	search: function (query) {
		OC.Search.search(query, null, 0, 30);
	},
	/**
	 * Dialog helper for jquery dialogs.
	 *
	 * @namespace OC.dialogs
	 */
	dialogs: OCdialogs,
	/**
	 * Parses a URL query string into a JS map
	 * @param {string} queryString query string in the format param1=1234&param2=abcde&param3=xyz
	 * @return {Object.<string, string>} map containing key/values matching the URL parameters
	 */
	parseQueryString: function (queryString) {
		var parts,
			pos,
			components,
			result = {},
			key,
			value;
		if (!queryString) {
			return null;
		}
		pos = queryString.indexOf('?');
		if (pos >= 0) {
			queryString = queryString.substr(pos + 1);
		}
		parts = queryString.replace(/\+/g, '%20').split('&');
		for (var i = 0; i < parts.length; i++) {
			// split on first equal sign
			var part = parts[i];
			pos = part.indexOf('=');
			if (pos >= 0) {
				components = [
					part.substr(0, pos),
					part.substr(pos + 1)
				];
			}
			else {
				// key only
				components = [part];
			}
			if (!components.length) {
				continue;
			}
			key = decodeURIComponent(components[0]);
			if (!key) {
				continue;
			}
			// if equal sign was there, return string
			if (components.length > 1) {
				result[key] = decodeURIComponent(components[1]);
			}
			// no equal sign => null value
			else {
				result[key] = null;
			}
		}
		return result;
	},

	/**
	 * Builds a URL query from a JS map.
	 * @param {Object.<string, string>} params map containing key/values matching the URL parameters
	 * @return {string} String containing a URL query (without question) mark
	 */
	buildQueryString: function (params) {
		if (!params) {
			return '';
		}
		return $.map(params, function (value, key) {
			var s = encodeURIComponent(key);
			if (value !== null && typeof(value) !== 'undefined') {
				s += '=' + encodeURIComponent(value);
			}
			return s;
		}).join('&');
	},

	/**
	 * Opens a popup with the setting for an app.
	 * @param {string} appid The ID of the app e.g. 'calendar', 'contacts' or 'files'.
	 * @param {boolean|string} loadJS If true 'js/settings.js' is loaded. If it's a string
	 * it will attempt to load a script by that name in the 'js' directory.
	 * @param {boolean} [cache] If true the javascript file won't be forced refreshed. Defaults to true.
	 * @param {string} [scriptName] The name of the PHP file to load. Defaults to 'settings.php' in
	 * the root of the app directory hierarchy.
	 */
	appSettings: function (args) {
		if (typeof args === 'undefined' || typeof args.appid === 'undefined') {
			throw {name: 'MissingParameter', message: 'The parameter appid is missing'};
		}
		var props = {scriptName: 'settings.php', cache: true};
		$.extend(props, args);
		var settings = $('#appsettings');
		if (settings.length === 0) {
			throw {
				name: 'MissingDOMElement',
				message: 'There has be be an element with id "appsettings" for the popup to show.'
			};
		}
		var popup = $('#appsettings_popup');
		if (popup.length === 0) {
			$('body').prepend('<div class="popup hidden" id="appsettings_popup"></div>');
			popup = $('#appsettings_popup');
			popup.addClass(settings.hasClass('topright') ? 'topright' : 'bottomleft');
		}
		if (popup.is(':visible')) {
			popup.hide().remove();
		} else {
			var arrowclass = settings.hasClass('topright') ? 'up' : 'left';
			var jqxhr = $.get(OC.filePath(props.appid, '', props.scriptName), function (data) {
				popup.html(data).ready(function () {
					popup.prepend('<span class="arrow ' + arrowclass + '"></span><h2>' + t('core', 'Settings') + '</h2><a class="close"></a>').show();
					popup.find('.close').bind('click', function () {
						popup.remove();
					});
					if (typeof props.loadJS !== 'undefined') {
						var scriptname;
						if (props.loadJS === true) {
							scriptname = 'settings.js';
						} else if (typeof props.loadJS === 'string') {
							scriptname = props.loadJS;
						} else {
							throw {
								name: 'InvalidParameter',
								message: 'The "loadJS" parameter must be either boolean or a string.'
							};
						}
						if (props.cache) {
							$.ajaxSetup({cache: true});
						}
						$.getScript(OC.filePath(props.appid, 'js', scriptname))
							.fail(function (jqxhr, settings, e) {
								throw e;
							});
					}
				}).show();
			}, 'html');
		}
	},

	/**
	 * For menu toggling
	 * @todo Write documentation
	 */
	registerMenu: function ($toggle, $menuEl) {
		var self = this;
		$menuEl.addClass('menu');
		$toggle.on('click.menu', function (event) {
			// prevent the link event (append anchor to URL)
			event.preventDefault();

			if ($menuEl.is(OC._currentMenu)) {
				self.hideMenus();
				return;
			}
			// another menu was open?
			else if (OC._currentMenu) {
				// close it
				self.hideMenus();
			}
			$menuEl.slideToggle(OC.menuSpeed);
			OC._currentMenu = $menuEl;
			OC._currentMenuToggle = $toggle;
		});
	},

	/**
	 *  @todo Write documentation
	 */
	unregisterMenu: function ($toggle, $menuEl) {
		// close menu if opened
		if ($menuEl.is(OC._currentMenu)) {
			this.hideMenus();
		}
		$toggle.off('click.menu').removeClass('menutoggle');
		$menuEl.removeClass('menu');
	},

	/**
	 * Hides any open menus
	 *
	 * @param {Function} complete callback when the hiding animation is done
	 */
	hideMenus: function (complete) {
		if (OC._currentMenu) {
			var lastMenu = OC._currentMenu;
			OC._currentMenu.trigger(new $.Event('beforeHide'));
			OC._currentMenu.slideUp(OC.menuSpeed, function () {
				lastMenu.trigger(new $.Event('afterHide'));
				if (complete) {
					complete.apply(this, arguments);
				}
			});
		}
		OC._currentMenu = null;
		OC._currentMenuToggle = null;
	},

	/**
	 * Shows a given element as menu
	 *
	 * @param {Object} [$toggle=null] menu toggle
	 * @param {Object} $menuEl menu element
	 * @param {Function} complete callback when the showing animation is done
	 */
	showMenu: function ($toggle, $menuEl, complete) {
		if ($menuEl.is(OC._currentMenu)) {
			return;
		}
		this.hideMenus();
		OC._currentMenu = $menuEl;
		OC._currentMenuToggle = $toggle;
		$menuEl.trigger(new $.Event('beforeShow'));
		$menuEl.show();
		$menuEl.trigger(new $.Event('afterShow'));
		// no animation
		if (_.isFunction(complete)) {
			complete();
		}
	},

	/**
	 * Wrapper for matchMedia
	 *
	 * This is makes it possible for unit tests to
	 * stub matchMedia (which doesn't work in PhantomJS)
	 * @private
	 */
	_matchMedia: function (media) {
		if (window.matchMedia) {
			return window.matchMedia(media);
		}
		return false;
	},

	/**
	 * Returns the user's locale
	 *
	 * @return {String} locale string
	 */
	getLocale: function () {
		return $('html').prop('lang');
	},

	/**
	 * Returns whether the current user is an administrator
	 *
	 * @return {bool} true if the user is an admin, false otherwise
	 * @since 9.0.0
	 */
	isUserAdmin: function () {
		return oc_isadmin;
	},

	/**
	 * Process ajax error, redirects to main page
	 * if an error/auth error status was returned.
	 */
	_processAjaxError: function (xhr) {
		var self = this;
		// purposefully aborted request ?
		// this._userIsNavigatingAway needed to distinguish ajax calls cancelled by navigating away
		// from calls cancelled by failed cross-domain ajax due to SSO redirect
		if (xhr.status === 0 && (xhr.statusText === 'abort' || xhr.statusText === 'timeout' || self._reloadCalled)) {
			return;
		}

		if (_.contains([0, 302, 303, 307, 401], xhr.status)) {
			// sometimes "beforeunload" happens later, so need to defer the reload a bit
			setTimeout(function () {
				if (!self._userIsNavigatingAway && !self._reloadCalled) {
					OC.Notification.show(t('core', 'Problem loading page, reloading in 5 seconds'));
					setTimeout(OC.reload, 5000);
					// only call reload once
					self._reloadCalled = true;
				}
			}, 100);
		}
	},

	/**
	 * Registers XmlHttpRequest object for global error processing.
	 *
	 * This means that if this XHR object returns 401 or session timeout errors,
	 * the current page will automatically be reloaded.
	 *
	 * @param {XMLHttpRequest} xhr
	 */
	registerXHRForErrorProcessing: function (xhr) {
		var loadCallback = function () {
			if (xhr.readyState !== 4) {
				return;
			}

			if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
				return;
			}

			// fire jquery global ajax error handler
			$(document).trigger(new $.Event('ajaxError'), xhr);
		};

		var errorCallback = function () {
			// fire jquery global ajax error handler
			$(document).trigger(new $.Event('ajaxError'), xhr);
		};

		if (xhr.addEventListener) {
			xhr.addEventListener('load', loadCallback);
			xhr.addEventListener('error', errorCallback);
		}

	}
};

/**
 * Current user attributes
 *
 * @typedef {Object} OC.CurrentUser
 *
 * @property {String} uid user id
 * @property {String} displayName display name
 * @property {Array} groups users group ids
 */

/**
 * @namespace OC.Plugins
 */
OC.Plugins = {
	/**
	 * @type Array.<OC.Plugin>
	 */
	_plugins: {},

	/**
	 * Register plugin
	 *
	 * @param {String} targetName app name / class name to hook into
	 * @param {OC.Plugin} plugin
	 * @param {String} priority priority of the plugin. sortPluginsByPriority()
	 * can be used to sort given plugins by their priority.
	 */
	register: function (targetName, plugin, priority) {
		if (!priority) {
			priority = 50;
		}
		var plugins = this._plugins[targetName];
		if (!plugins) {
			plugins = this._plugins[targetName] = [];
		}
		plugins.push({plugin: plugin, priority: priority});
	},

	/**
	 * Returns all plugin registered to the given target
	 * name / app name / class name.
	 *
	 * @param {String} targetName app name / class name to hook into
	 * @return {Array.<OC.Plugin>} array of plugins
	 */
	getPlugins: function (targetName) {
		return this._plugins[targetName] || [];
	},

	/**
	 * Sort a list of given plugins by their priority.
	 * A higher priority means the plugin is listed before others.
	 *
	 * @param {Array.<OC.Plugin>} plugins
	 */
	sortPluginsByPriority: function (plugins) {
		return plugins.sort(function(a, b) {
			if (a.priority > b.priority) {
				return -1;
			}
			if (a.priority < b.priority) {
				return 1;
			}
			return 0;
		});
	},

	/**
	 * Call attach() on all plugins registered to the given target name.
	 *
	 * @param {String} targetName app name / class name
	 * @param {Object} object to be extended
	 * @param {Object} [options] options
	 */
	attach: function (targetName, targetObject, options) {
		var plugins = this.getPlugins(targetName);
		plugins = this.sortPluginsByPriority(plugins);
		for (var i = 0; i < plugins.length; i++) {
			var plugin = plugins[i].plugin;
			if (plugin.attach) {
				plugin.attach(targetObject, options);
			}
		}
	},

	/**
	 * Call detach() on all plugins registered to the given target name.
	 *
	 * @param {String} targetName app name / class name
	 * @param {Object} object to be extended
	 * @param {Object} [options] options
	 */
	detach: function (targetName, targetObject, options) {
		var plugins = this.getPlugins(targetName);
		plugins = this.sortPluginsByPriority(plugins);
		for (var i = 0; i < plugins.length; i++) {
			var plugin = plugins[i].plugin;
			if (plugin.detach) {
				plugin.detach(targetObject, options);
			}
		}
	},

	/**
	 * Plugin
	 *
	 * @todo make this a real class in the future
	 * @typedef {Object} OC.Plugin
	 *
	 * @property {String} name plugin name
	 * @property {Function} attach function that will be called when the
	 * plugin is attached
	 * @property {Function} [detach] function that will be called when the
	 * plugin is detached
	 */

};

/**
 * @namespace OC.search
 */
OC.search.customResults = {};
/**
 * @deprecated use get/setFormatter() instead
 */
OC.search.resultTypes = {};

OC.addStyle.loaded = [];
OC.addScript.loaded = [];

/**
 * A little class to manage a status field for a "saving" process.
 * It can be used to display a starting message (e.g. "Saving...") and then
 * replace it with a green success message or a red error message.
 *
 * @namespace OC.msg
 */
OC.msg = {
	/**
	 * Displayes a "Saving..." message in the given message placeholder
	 *
	 * @param {Object} selector    Placeholder to display the message in
	 */
	startSaving: function (selector) {
		this.startAction(selector, t('core', 'Saving...'));
	},

	/**
	 * Displayes a custom message in the given message placeholder
	 *
	 * @param {Object} selector    Placeholder to display the message in
	 * @param {string} message    Plain text message to display (no HTML allowed)
	 */
	startAction: function (selector, message) {
		$(selector).text(message)
			.removeClass('success')
			.removeClass('error')
			.stop(true, true)
			.show();
	},

	/**
	 * Displayes an success/error message in the given selector
	 *
	 * @param {Object} selector    Placeholder to display the message in
	 * @param {Object} response    Response of the server
	 * @param {Object} response.data    Data of the servers response
	 * @param {string} response.data.message    Plain text message to display (no HTML allowed)
	 * @param {string} response.status    is being used to decide whether the message
	 * is displayed as an error/success
	 */
	finishedSaving: function (selector, response) {
		this.finishedAction(selector, response);
	},

	/**
	 * Displayes an success/error message in the given selector
	 *
	 * @param {Object} selector    Placeholder to display the message in
	 * @param {Object} response    Response of the server
	 * @param {Object} response.data Data of the servers response
	 * @param {string} response.data.message Plain text message to display (no HTML allowed)
	 * @param {string} response.status is being used to decide whether the message
	 * is displayed as an error/success
	 */
	finishedAction: function (selector, response) {
		if (response.status === "success") {
			this.finishedSuccess(selector, response.data.message);
		} else {
			this.finishedError(selector, response.data.message);
		}
	},

	/**
	 * Displayes an success message in the given selector
	 *
	 * @param {Object} selector Placeholder to display the message in
	 * @param {string} message Plain text success message to display (no HTML allowed)
	 */
	finishedSuccess: function (selector, message) {
		$(selector).text(message)
			.addClass('success')
			.removeClass('error')
			.stop(true, true)
			.delay(3000)
			.fadeOut(900)
			.show();
	},

	/**
	 * Displayes an error message in the given selector
	 *
	 * @param {Object} selector Placeholder to display the message in
	 * @param {string} message Plain text error message to display (no HTML allowed)
	 */
	finishedError: function (selector, message) {
		$(selector).text(message)
			.addClass('error')
			.removeClass('success')
			.show();
	}
};

/**
 * @todo Write documentation
 * @namespace
 */
OC.Notification = {
	queuedNotifications: [],
	getDefaultNotificationFunction: null,

	/**
	 * @type Array.<int> array of notification timers
	 */
	notificationTimers: [],

	/**
	 * @param callback
	 * @todo Write documentation
	 */
	setDefault: function (callback) {
		OC.Notification.getDefaultNotificationFunction = callback;
	},

	/**
	 * Hides a notification.
	 *
	 * If a row is given, only hide that one.
	 * If no row is given, hide all notifications.
	 *
	 * @param {jQuery} [$row] notification row
	 * @param {Function} [callback] callback
	 */
	hide: function ($row, callback) {
		var self = this;
		var $notification = $('#notification');

		if (_.isFunction($row)) {
			// first arg is the callback
			callback = $row;
			$row = undefined;
		}

		if (!$row) {
			console.warn('Missing argument $row in OC.Notification.hide() call, caller needs to be adjusted to only dismiss its own notification');
			// assume that the row to be hidden is the first one
			$row = $notification.find('.row:first');
		}

		if ($row && $notification.find('.row').length > 1) {
			// remove the row directly
			$row.remove();
			if (callback) {
				callback.call();
			}
			return;
		}

		_.defer(function () {
			// fade out is supposed to only fade when there is a single row
			// however, some code might call hide() and show() directly after,
			// which results in more than one element
			// in this case, simply delete that one element that was supposed to
			// fade out
			//
			// FIXME: remove once all callers are adjusted to only hide their own notifications
			if ($notification.find('.row').length > 1) {
				$row.remove();
				return;
			}

			// else, fade out whatever was present
			$notification.fadeOut('400', function () {
				if (self.isHidden()) {
					if (self.getDefaultNotificationFunction) {
						self.getDefaultNotificationFunction.call();
					}
				}
				if (callback) {
					callback.call();
				}
				$notification.empty();
			});
		});
	},

	/**
	 * Shows a notification as HTML without being sanitized before.
	 * If you pass unsanitized user input this may lead to a XSS vulnerability.
	 * Consider using show() instead of showHTML()
	 *
	 * @param {string} html Message to display
	 * @param {Object} [options] options
	 * @param {string] [options.type] notification type
	 * @param {int} [options.timeout=0] timeout value, defaults to 0 (permanent)
	 * @return {jQuery} jQuery element for notification row
	 */
	showHtml: function (html, options) {
		options = options || {};
		_.defaults(options, {
			timeout: 0
		});

		var self = this;
		var $notification = $('#notification');
		if (this.isHidden()) {
			$notification.fadeIn().css('display', 'inline-block');
		}
		var $row = $('<div class="row"></div>');
		if (options.type) {
			$row.addClass('type-' + options.type);
		}
		if (options.type === 'error') {
			// add a close button
			var $closeButton = $('<a class="action close icon-close" href="#"></a>');
			$closeButton.attr('alt', t('core', 'Dismiss'));
			$row.append($closeButton);
			$closeButton.one('click', function () {
				self.hide($row);
				return false;
			});
			$row.addClass('closeable');
		}

		$row.prepend(html);
		$notification.append($row);

		if (options.timeout > 0) {
			// register timeout to vanish notification
			this.notificationTimers.push(setTimeout(function () {
				self.hide($row);
			}, (options.timeout * 1000)));
		}

		return $row;
	},

	/**
	 * Shows a sanitized notification
	 *
	 * @param {string} text Message to display
	 * @param {Object} [options] options
	 * @param {string} [options.type] notification type
	 * @param {int} [options.timeout=0] timeout value, defaults to 0 (permanent)
	 * @return {jQuery} jQuery element for notification row
	 */
	show: function (text, options) {
		return this.showHtml($('<div/>').text(text).html(), options);
	},

	/**
	 * Shows a notification that disappears after x seconds, default is
	 * 7 seconds
	 *
	 * @param {string} text Message to show
	 * @param {array} [options] options array
	 * @param {int} [options.timeout=7] timeout in seconds, if this is 0 it will show the message permanently
	 * @param {boolean} [options.isHTML=false] an indicator for HTML notifications (true) or text (false)
	 * @param {string] [options.type] notification type
	 */
	showTemporary: function (text, options) {
		var self = this;
		var defaults = {
			isHTML: false,
			timeout: 7
		};
		options = options || {};
		// merge defaults with passed in options
		_.defaults(options, defaults);

		var $row;
		if (options.isHTML) {
			$row = this.showHtml(text, options);
		} else {
			$row = this.show(text, options);
		}
		return $row;
	},

	/**
	 * Returns whether a notification is hidden.
	 * @return {boolean}
	 */
	isHidden: function () {
		return !$("#notification").find('.row').length;
	}
};

/**
 * Breadcrumb class
 *
 * @namespace
 *
 * @deprecated will be replaced by the breadcrumb implementation
 * of the files app in the future
 */
OC.Breadcrumb = {
	container: null,
	/**
	 * @todo Write documentation
	 * @param dir
	 * @param leafName
	 * @param leafLink
	 */
	show: function (dir, leafName, leafLink) {
		if (!this.container) {//default
			this.container = $('#controls');
		}
		this._show(this.container, dir, leafName, leafLink);
	},
	_show: function (container, dir, leafname, leaflink) {
		var self = this;

		this._clear(container);

		// show home + path in subdirectories
		if (dir) {
			//add home
			var link = OC.linkTo('files', 'index.php');

			var crumb = $('<div/>');
			crumb.addClass('crumb');

			var crumbLink = $('<a/>');
			crumbLink.attr('href', link);

			var crumbImg = $('<img/>');
			crumbImg.attr('src', OC.imagePath('core', 'places/home'));
			crumbLink.append(crumbImg);
			crumb.append(crumbLink);
			container.prepend(crumb);

			//add path parts
			var segments = dir.split('/');
			var pathurl = '';
			jQuery.each(segments, function (i, name) {
				if (name !== '') {
					pathurl = pathurl + '/' + name;
					var link = OC.linkTo('files', 'index.php') + '?dir=' + encodeURIComponent(pathurl);
					self._push(container, name, link);
				}
			});
		}

		//add leafname
		if (leafname && leaflink) {
			this._push(container, leafname, leaflink);
		}
	},

	/**
	 * @todo Write documentation
	 * @param {string} name
	 * @param {string} link
	 */
	push: function (name, link) {
		if (!this.container) {//default
			this.container = $('#controls');
		}
		return this._push(OC.Breadcrumb.container, name, link);
	},
	_push: function (container, name, link) {
		var crumb = $('<div/>');
		crumb.addClass('crumb').addClass('last');

		var crumbLink = $('<a/>');
		crumbLink.attr('href', link);
		crumbLink.text(name);
		crumb.append(crumbLink);

		var existing = container.find('div.crumb');
		if (existing.length) {
			existing.removeClass('last');
			existing.last().after(crumb);
		} else {
			container.prepend(crumb);
		}
		return crumb;
	},

	/**
	 * @todo Write documentation
	 */
	pop: function () {
		if (!this.container) {//default
			this.container = $('#controls');
		}
		this.container.find('div.crumb').last().remove();
		this.container.find('div.crumb').last().addClass('last');
	},

	/**
	 * @todo Write documentation
	 */
	clear: function () {
		if (!this.container) {//default
			this.container = $('#controls');
		}
		this._clear(this.container);
	},
	_clear: function (container) {
		container.find('div.crumb').remove();
	}
};

if (typeof localStorage !== 'undefined' && localStorage !== null) {
	/**
	 * User and instance aware localstorage
	 * @namespace
	 */
	OC.localStorage = {
		namespace: 'oc_' + OC.currentUser + '_' + OC.webroot + '_',

		/**
		 * Whether the storage contains items
		 * @param {string} name
		 * @return {boolean}
		 */
		hasItem: function (name) {
			return OC.localStorage.getItem(name) !== null;
		},

		/**
		 * Add an item to the storage
		 * @param {string} name
		 * @param {string} item
		 */
		setItem: function (name, item) {
			return localStorage.setItem(OC.localStorage.namespace + name, JSON.stringify(item));
		},

		/**
		 * Removes an item from the storage
		 * @param {string} name
		 * @param {string} item
		 */
		removeItem: function (name, item) {
			return localStorage.removeItem(OC.localStorage.namespace + name);
		},

		/**
		 * Get an item from the storage
		 * @param {string} name
		 * @return {null|string}
		 */
		getItem: function (name) {
			var item = localStorage.getItem(OC.localStorage.namespace + name);
			if (item === null) {
				return null;
			} else {
				return JSON.parse(item);
			}
		}
	};
} else {
	//dummy localstorage
	OC.localStorage = {
		hasItem: function () {
			return false;
		},
		setItem: function () {
			return false;
		},
		getItem: function () {
			return null;
		}
	};
}

/**
 * prototypical inheritance functions
 * @todo Write documentation
 * usage:
 * MySubObject=object(MyObject)
 */
function object(o) {
	function F() {
	}

	F.prototype = o;
	return new F();
}

/**
 * Initializes core
 */
function initCore() {
	/**
	 * Disable automatic evaluation of responses for $.ajax() functions (and its
	 * higher-level alternatives like $.get() and $.post()).
	 *
	 * If a response to a $.ajax() request returns a content type of "application/javascript"
	 * JQuery would previously execute the response body. This is a pretty unexpected
	 * behaviour and can result in a bypass of our Content-Security-Policy as well as
	 * multiple unexpected XSS vectors.
	 */
	$.ajaxSetup({
		contents: {
			script: false
		}
	});

	$('#body-login form label').css({
		color: $('p.info').css('color')
	});

	if ($('#body-login .v-align').length > 0 ) {
		$('#body-login .v-align').fadeIn(600);
		setTimeout(function () {
			$('#body-login footer *').addClass('show');
		}, 250);
	}

	/**
	 * Set users locale to moment.js as soon as possible
	 */
	moment.locale(OC.getLocale());

	/*
	 * Override browser locales with OC locale in ajax requests
	 */
	$.ajaxSetup({
		beforeSend: function(xhr) {
			xhr.setRequestHeader('Accept-Language', OC.getLocale());
		}
	});

	var userAgent = window.navigator.userAgent;
	var msie = userAgent.indexOf('MSIE ');
	var trident = userAgent.indexOf('Trident/');
	var edge = userAgent.indexOf('Edge/');

	if (msie > 0 || trident > 0) {
		// (IE 10 or older) || IE 11
		$('html').addClass('ie');
	} else if (edge > 0) {
		// for edge
		$('html').addClass('edge');
	}

	$(window).on('unload.main', function () {
		OC._unloadCalled = true;
	});
	$(window).on('beforeunload.main', function () {
		// super-trick thanks to http://stackoverflow.com/a/4651049
		// in case another handler displays a confirmation dialog (ex: navigating away
		// during an upload), there are two possible outcomes: user clicked "ok" or
		// "cancel"

		// first timeout handler is called after unload dialog is closed
		setTimeout(function () {
			OC._userIsNavigatingAway = true;

			// second timeout event is only called if user cancelled (Chrome),
			// but in other browsers it might still be triggered, so need to
			// set a higher delay...
			setTimeout(function () {
				if (!OC._unloadCalled) {
					OC._userIsNavigatingAway = false;
				}
			}, 10000);
		}, 1);
	});
	$(document).on('ajaxError.main', function (event, request, settings) {
		if (settings && settings.allowAuthErrors) {
			return;
		}
		OC._processAjaxError(request);
	});

	/**
	 * Calls the server periodically to ensure that session doesn't
	 * time out
	 */
	function initSessionHeartBeat() {
		// max interval in seconds set to 24 hours
		var maxInterval = 24 * 3600;
		// interval in seconds
		var interval = 900;
		if (oc_config.session_lifetime) {
			interval = Math.floor(oc_config.session_lifetime / 2);
		}
		// minimum one minute
		if (interval < 60) {
			interval = 60;
		}
		if (interval > maxInterval) {
			interval = maxInterval;
		}
		var url = OC.generateUrl('/heartbeat');
		var heartBeatTimeout = null;
		var heartBeat = function () {
			clearInterval(heartBeatTimeout);
			heartBeatTimeout = setInterval(function () {
				$.post(url);
			}, interval * 1000);
		};
		heartBeat();
	}

	/**
	 * Check mouse movement to send a heartbeat if the mouse moved
	 */
	function initMouseTrack() {
		var interval = 120;  // 2 minutes
		if (oc_config.session_lifetime) {
			interval = Math.floor(oc_config.session_lifetime / 2);
		}
		interval = Math.min(Math.max(interval, 60), 3600);  // ensure interval is in [60, 3600]

		var extendableHeartbeat = null;
		var extendableMouseMoved = false;
		var mouseMoved = false;
		var heartbeatTimestamp = 0;

		// If the mouse has moved within this interval, set a timeout to send
		// a heartbeat request. If the mouse moves again in the next interval,
		// the timeout will be extended. Note that the heartbeat request might
		// be delayed indefinitely.
		setInterval(function() {
			if (extendableMouseMoved) {
				clearTimeout(extendableHeartbeat);
				extendableHeartbeat = setTimeout(function() {
					if (!extendableMouseMoved) {
						// if the mouse has moved, either this timeout has been cleared and
						// a new one is being created, or a new timeout will be created soon
						// (if this timeout is executed before the setInterval function)
						var currentTimestamp = Date.now();
						if (currentTimestamp > heartbeatTimestamp + (30 * 1000)) {
							// if a heartbeat has been sent recently, don't send a new one
							console.log('I1 sending heartbeat');
							$.post(OC.generateUrl('/heartbeat'));
							heartbeatTimestamp = currentTimestamp;
						} else {
							console.log('I1 skipping heartbeat');
						}
					} else {
						console.log('I1 delaying hearbeat because mouse moved.');
					}
				}, 30 * 1000);
			}
			extendableMouseMoved = false;
		}, 30 * 1000);

		// If the mouse has been moved within this interval, send a heartbeat
		// immediately. This will prevent the session to expire.
		setInterval(function() {
			if (mouseMoved) {
				var currentTimestamp = Date.now();
				if (currentTimestamp > heartbeatTimestamp + (interval * 1000)) {
					// if a heartbeat has been sent recently, don't send a new one
					console.log('I2 sending heartbeat');
					$.post(OC.generateUrl('/heartbeat'));
					heartbeatTimestamp = currentTimestamp;
				} else {
					console.log('I2 skipping heartbeat');
				}
			}
			mouseMoved = false;  // no need to wait for the response
		}, interval * 1000);

		// set a couple of variables to indicate that the mouse has moved
		$(window).on('mousemove.sessiontrack', function() {
			mouseMoved = true;
			extendableMouseMoved = true;
		});
	}

	// session heartbeat (defaults to enabled)
	if (typeof(oc_config.session_keepalive) === 'undefined' || !!oc_config.session_keepalive) {

		initSessionHeartBeat();
	} else {
		initMouseTrack();
	}

	if (oc_config.session_forced_logout_timeout !== undefined && oc_config.session_forced_logout_timeout > 0) {
		$(window).on('beforeunload.sessiontrack', function() {
			var requestData = {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Requested-With': 'XMLHttpRequest'
				},
				body: JSON.stringify({t: oc_config.session_forced_logout_timeout}),
				credentials: 'same-origin',
				keepalive: true
			};
			var r = undefined;
			if (typeof Request !== "undefined") {
				// IE 11 doesn't have support "Request", so we'll fallback to ajax
				r = new Request(OC.generateUrl('/heartbeat'), requestData);
			}
			if (r === undefined || r.keepalive === undefined) {
				// firefox doesn't support keepalive (checked 11th Apr 2022)
				// try a sync ajax call instead
				$.ajax({
					method: 'POST',
					url: OC.generateUrl('/heartbeat'),
					data: {t: oc_config.session_forced_logout_timeout},
					async: false
				});
			} else {
				fetch(r);
			}
		});
	}

	OC.registerMenu($('#expand'), $('#expanddiv'));

	/**
	 * This event gets fired, if your focused element is for example the navbar
	 * and you click on an iframe.
	 * So we can close the open menus, for example the #settings menu
	 */
	$(window).on('blur.closemenus',function(){
		OC.hideMenus();
	});

	// toggle for menus
	$(document).on('mouseup.closemenus', function (event) {
		var $el = $(event.target);
		if ($el.closest('.menu').length || $el.closest('.menutoggle').length) {
			// don't close when clicking on the menu directly or a menu toggle
			return false;
		}

		OC.hideMenus();
	});

	/**
	 * Set up the main menu toggle to react to media query changes.
	 * If the screen is small enough, the main menu becomes a toggle.
	 * If the screen is bigger, the main menu is not a toggle any more.
	 */
	function setupMainMenu() {
		// toggle the navigation
		var $toggle = $('#header .header-appname-container');
		var $navigation = $('#navigation');

		// init the menu
		OC.registerMenu($toggle, $navigation);
		$toggle.data('oldhref', $toggle.attr('href'));
		$toggle.attr('href', '#');
		$navigation.hide();

		// show loading feedback
		$navigation.delegate('a', 'click', function (event) {
			var $app = $(event.target);
			if (!$app.is('a')) {
				$app = $app.closest('a');
			}
			if (!event.ctrlKey) {
				$app.addClass('app-loading');
			} else {
				// Close navigation when opening app in
				// a new tab
				OC.hideMenus();
			}
		});
	}

	function setupUserMenu() {
		var $menu = $('#header #settings');

		$menu.delegate('a', 'click', function (event) {
			var $page = $(event.target);
			if (!$page.is('a')) {
				$page = $page.closest('a');
			}
			$page.find('img').remove();
			$page.find('div').remove(); // prevent odd double-clicks
			$page.prepend($('<div/>').addClass('icon-loading-small-dark'));
		});
	}

	setupMainMenu();
	setupUserMenu();

	// just add snapper for logged in users
	if ($('#app-navigation').length && !$('html').hasClass('lte9')) {

		// App sidebar on mobile
		var snapper = new Snap({
			element: document.getElementById('app-content'),
			disable: 'right',
			maxPosition: 250,
			minDragDistance: 100
		});
		$('#app-content').prepend('<div id="app-navigation-toggle" class="icon-menu" style="display:none;"></div>');
		$('#app-navigation-toggle').click(function () {
			if (snapper.state().state == 'left') {
				snapper.close();
			} else {
				snapper.open('left');
			}
		});
		// close sidebar when switching navigation entry
		var $appNavigation = $('#app-navigation');
		$appNavigation.delegate('a, :button', 'click', function (event) {
			var $target = $(event.target);
			// don't hide navigation when changing settings or adding things
			if ($target.is('.app-navigation-noclose') ||
				$target.closest('.app-navigation-noclose').length) {
				return;
			}
			if ($target.is('.add-new') ||
				$target.closest('.add-new').length) {
				return;
			}
			if ($target.is('#app-settings') ||
				$target.closest('#app-settings').length) {
				return;
			}
			snapper.close();
		});

		var toggleSnapperOnSize = function () {
			if ($(window).width() > 768) {
				snapper.close();
				snapper.disable();
			} else {
				snapper.enable();
			}
		};

		$(window).resize(_.debounce(toggleSnapperOnSize, 250));

		// initial call
		toggleSnapperOnSize();

		// adjust controls bar width
		var adjustControlsWidth = function () {
			if ($('#controls').length) {
				var controlsWidth;
				// if there is a scrollbar …
				if ($('#app-content').get(0).scrollHeight > $('#app-content').height()) {
					if ($(window).width() > 768) {
						controlsWidth = $('#content').width() - $('#app-navigation').width() - getScrollBarWidth();
						if (!$('#app-sidebar').hasClass('hidden') && !$('#app-sidebar').hasClass('disappear')) {
							controlsWidth -= $('#app-sidebar').width();
						}
					} else {
						controlsWidth = $('#content').width() - getScrollBarWidth();
					}
				} else { // if there is none
					if ($(window).width() > 768) {
						controlsWidth = $('#content').width() - $('#app-navigation').width();
						if (!$('#app-sidebar').hasClass('hidden') && !$('#app-sidebar').hasClass('disappear')) {
							controlsWidth -= $('#app-sidebar').width();
						}
					} else {
						controlsWidth = $('#content').width();
					}
				}
				$('#controls').css('width', controlsWidth);
				$('#controls').css('min-width', controlsWidth);
			}
		};

		$(window).resize(_.debounce(adjustControlsWidth, 250));

		$('body').delegate('#app-content', 'apprendered appresized', adjustControlsWidth);

	}
}

/**
 * Disable the use of globalEval in jQuery 2.1.4.
 * This is required for API compatibility, yet should not be available all the
 * same.
 *
 * @see https://github.com/jquery/jquery/issues/2432 for further details.
 */
$.fn.globalEval = function(){};

/**
 * Make htmlPrefilter an identity function in jQuery 2.1.4.
 *
 * @see https://github.com/advisories/GHSA-gxr4-xjj5-5px2
 */
$.fn.htmlPrefilter = function(html) {
	return html;
};

$(document).ready(initCore);

/**
 * Filter Jquery selector by attribute value
 */
$.fn.filterAttr = function (attr_name, attr_value) {
	return this.filter(function () {
		return $(this).attr(attr_name) === attr_value;
	});
};

/**
 * Returns a human readable file size
 * @param {number} size Size in bytes
 * @param {boolean} skipSmallSizes return '< 1 kB' for small files
 * @return {string}
 */
function humanFileSize(size, skipSmallSizes) {
	var humanList = ['B', 'KB', 'MB', 'GB', 'TB'];
	// Calculate Log with base 1024: size = 1024 ** order
	var order = size > 0 ? Math.floor(Math.log(size) / Math.log(1024)) : 0;
	// Stay in range of the byte sizes that are defined
	order = Math.min(humanList.length - 1, order);
	var readableFormat = humanList[order];
	var relativeSize = (size / Math.pow(1024, order)).toFixed(1);
	if (skipSmallSizes === true && order === 0) {
		if (relativeSize !== "0.0") {
			return '< 1 KB';
		} else {
			return '0 KB';
		}
	}
	if (order < 2) {
		relativeSize = parseFloat(relativeSize).toFixed(0);
	}
	else if (relativeSize.substr(relativeSize.length - 2, 2) === '.0') {
		relativeSize = relativeSize.substr(0, relativeSize.length - 2);
	}
	return relativeSize + ' ' + readableFormat;
}

/**
 * Format an UNIX timestamp to a human understandable format
 * @param {number} timestamp UNIX timestamp
 * @return {string} Human readable format
 */
function formatDate(timestamp) {
	return OC.Util.formatDate(timestamp);
}

//
/**
 * Get the value of a URL parameter
 * @link http://stackoverflow.com/questions/1403888/get-url-parameter-with-jquery
 * @param {string} name URL parameter
 * @return {string}
 */
function getURLParameter(name) {
	return decodeURI(
		(RegExp(name + '=' + '(.+?)(&|$)').exec(location.search) || [, null])[1]
	);
}

/**
 * Takes an absolute timestamp and return a string with a human-friendly relative date
 * @param {number} timestamp A Unix timestamp
 */
function relative_modified_date(timestamp) {
	/*
	 Were multiplying by 1000 to bring the timestamp back to its original value
	 per https://github.com/owncloud/core/pull/10647#discussion_r16790315
	 */
	return OC.Util.relativeModifiedDate(timestamp * 1000);
}

/**
 * Utility functions
 * @namespace
 */
OC.Util = {
	// TODO: remove original functions from global namespace
	humanFileSize: humanFileSize,

	/**
	* regular expression to parse size in bytes from a humanly readable string
	* see computerFileSize(string)
	*/
	_computerFileSizeRegexp: /^[\s+]?([0-9]*)(\.([0-9]+))?( +)?([kmgtp]?b?)$/i,

	/**
	 * Returns a file size in bytes from a humanly readable string
	 * Makes 2kB to 2048.
	 * Inspired by computerFileSize in helper.php
	 * @param  {string} string file size in human readable format
	 * @return {number} or null if string could not be parsed
	 *
	 *
	 */
	computerFileSize: function (string) {
		if (typeof string !== 'string') {
			return null;
		}

		var s = string.toLowerCase().trim();
		var bytes = null;

		var bytesArray = {
			'b': 1,
			'k': 1024,
			'kb': 1024,
			'mb': 1024 * 1024,
			'm': 1024 * 1024,
			'gb': 1024 * 1024 * 1024,
			'g': 1024 * 1024 * 1024,
			'tb': 1024 * 1024 * 1024 * 1024,
			't': 1024 * 1024 * 1024 * 1024,
			'pb': 1024 * 1024 * 1024 * 1024 * 1024,
			'p': 1024 * 1024 * 1024 * 1024 * 1024
		};

		var matches = s.match(this._computerFileSizeRegexp);
		if (matches !== null) {
			bytes = parseFloat(s);
			if (!isFinite(bytes)) {
				return null;
			}
		} else {
			return null;
		}
		if (matches[5]) {
			bytes = bytes * bytesArray[matches[5]];
		}

		bytes = Math.round(bytes);
		return bytes;
	},

	/**
	 * @param timestamp
	 * @param format
	 * @returns {string} timestamp formatted as requested
	 */
	formatDate: function (timestamp, format) {
		format = format || "LLL";
		return moment(timestamp).format(format);
	},

	/**
	 * @param timestamp
	 * @returns {string} human readable difference from now
	 */
	relativeModifiedDate: function (timestamp) {
		var diff = moment().diff(moment(timestamp));
		if (diff >= 0 && diff < 45000) {
			return t('core', 'seconds ago');
		}
		return moment(timestamp).fromNow();
	},
	/**
	 * Returns whether the browser supports SVG
	 * @deprecated SVG is always supported (since 9.0)
	 * @return {boolean} true if the browser supports SVG, false otherwise
	 */
	hasSVGSupport: function () {
		return true
	},
	/**
	 * If SVG is not supported, replaces the given icon's extension
	 * from ".svg" to ".png".
	 * If SVG is supported, return the image path as is.
	 * @param {string} file image path with svg extension
	 * @deprecated SVG is always supported (since 9.0)
	 * @return {string} fixed image path with png extension if SVG is not supported
	 */
	replaceSVGIcon: function (file) {
		return file;
	},
	/**
	 * Replace SVG images in all elements that have the "svg" class set
	 * with PNG images.
	 *
	 * @param $el root element from which to search, defaults to $('body')
	 * @deprecated SVG is always supported (since 9.0)
	 */
	replaceSVG: function ($el) {
	},

	/**
	 * Fix image scaling for IE8, since background-size is not supported.
	 *
	 * This scales the image to the element's actual size, the URL is
	 * taken from the "background-image" CSS attribute.
	 *
	 * @deprecated IE8 isn't supported since 9.0
	 * @param {Object} $el image element
	 */
	scaleFixForIE8: function ($el) {
	},

	/**
	 * Returns whether this is IE
	 *
	 * @deprecated Use bowser.mise instead (since 9.1)
	 * @return {bool} true if this is IE, false otherwise
	 */
	isIE: function () {
		return bowser.msie;
	},

	/**
	 * Returns whether this is IE8
	 *
	 * @deprecated IE8 isn't supported since 9.0
	 * @return {bool} false (IE8 isn't supported anymore)
	 */
	isIE8: function () {
		return false;
	},

	/**
	 * Returns the width of a generic browser scrollbar
	 *
	 * @return {int} width of scrollbar
	 */
	getScrollBarWidth: function () {
		if (this._scrollBarWidth) {
			return this._scrollBarWidth;
		}

		var inner = document.createElement('p');
		inner.style.width = "100%";
		inner.style.height = "200px";

		var outer = document.createElement('div');
		outer.style.position = "absolute";
		outer.style.top = "0px";
		outer.style.left = "0px";
		outer.style.visibility = "hidden";
		outer.style.width = "200px";
		outer.style.height = "150px";
		outer.style.overflow = "hidden";
		outer.appendChild(inner);

		document.body.appendChild(outer);
		var w1 = inner.offsetWidth;
		outer.style.overflow = 'scroll';
		var w2 = inner.offsetWidth;
		if (w1 === w2) {
			w2 = outer.clientWidth;
		}

		document.body.removeChild(outer);

		this._scrollBarWidth = (w1 - w2);

		return this._scrollBarWidth;
	},

	/**
	 * Remove the time component from a given date
	 *
	 * @param {Date} date date
	 * @return {Date} date with stripped time
	 */
	stripTime: function (date) {
		// FIXME: likely to break when crossing DST
		// would be better to use a library like momentJS
		return new Date(date.getFullYear(), date.getMonth(), date.getDate());
	},

	_chunkify: function (t) {
		// Adapted from http://my.opera.com/GreyWyvern/blog/show.dml/1671288
		var tz = [], x = 0, y = -1, n = 0, code, c;

		while (x < t.length) {
			c = t.charAt(x);
			// only include the dot in strings
			var m = ((!n && c === '.') || (c >= '0' && c <= '9'));
			if (m !== n) {
				// next chunk
				y++;
				tz[y] = '';
				n = m;
			}
			tz[y] += c;
			x++;
		}
		return tz;
	},
	/**
	 * Compare two strings to provide a natural sort
	 * @param a first string to compare
	 * @param b second string to compare
	 * @return -1 if b comes before a, 1 if a comes before b
	 * or 0 if the strings are identical
	 */
	naturalSortCompare: function (a, b) {
		var x;
		var aa = OC.Util._chunkify(a);
		var bb = OC.Util._chunkify(b);

		for (x = 0; aa[x] && bb[x]; x++) {
			if (aa[x] !== bb[x]) {
				var aNum = Number(aa[x]), bNum = Number(bb[x]);
				// note: == is correct here
				if (aNum == aa[x] && bNum == bb[x]) {
					return aNum - bNum;
				} else {
					// Forcing 'en' locale to match the server-side locale which is
					// always 'en'.
					//
					// Note: This setting isn't supported by all browsers but for the ones
					// that do there will be more consistency between client-server sorting
					return aa[x].localeCompare(bb[x], 'en');
				}
			}
		}
		return aa.length - bb.length;
	},
	/**
	 * Calls the callback in a given interval until it returns true
	 * @param {function} callback
	 * @param {integer} interval in milliseconds
	 */
	waitFor: function (callback, interval) {
		var internalCallback = function () {
			if (callback() !== true) {
				setTimeout(internalCallback, interval);
			}
		};

		internalCallback();
	},
	/**
	 * Checks if a cookie with the given name is present and is set to the provided value.
	 * @param {string} name name of the cookie
	 * @param {string} value value of the cookie
	 * @return {boolean} true if the cookie with the given name has the given value
	 */
	isCookieSetToValue: function (name, value) {
		var cookies = document.cookie.split(';');
		for (var i = 0; i < cookies.length; i++) {
			var cookie = cookies[i].split('=');
			if (cookie[0].trim() === name && cookie[1].trim() === value) {
				return true;
			}
		}
		return false;
	},

	/**
	 * Checks if an element is completely visible and scrolls the screen if not
	 * @param {jQuery} jQuery element that has to be displayed
	 * @param {jQuery} scroll container if null scrollContainer will be set to $('#app-content')
	 */
	scrollIntoView: function (toViewEl, scrollContainer) {

		var toViewElTopLocation = toViewEl.offset().top;
		var toViewElHeight = toViewEl.outerHeight();
		var toViewElBottomLocation = toViewElTopLocation + toViewElHeight + 50;
		var windowHeight = $(window).height();

		if (scrollContainer === null) {
			scrollContainer = $('#app-content');
		}

		if (toViewElBottomLocation > windowHeight) {
			var currentPosition = scrollContainer[0].scrollTop;
			var scrollDistance = toViewElBottomLocation - windowHeight;
			scrollContainer.stop();
			scrollContainer.animate({
				scrollTop: currentPosition + scrollDistance
			}, 700);
		}
	}
};

/**
 * Utility class for the history API,
 * includes fallback to using the URL hash when
 * the browser doesn't support the history API.
 *
 * @namespace
 */
OC.Util.History = {
	_handlers: [],

	/**
	 * Push the current URL parameters to the history stack
	 * and change the visible URL.
	 * Note: this includes a workaround for IE8/IE9 that uses
	 * the hash part instead of the search part.
	 *
	 * @param params to append to the URL, can be either a string
	 * or a map
	 * @param {boolean} [replace=false] whether to replace instead of pushing
	 */
	_pushState: function (params, replace) {
		var strParams;
		if (typeof(params) === 'string') {
			strParams = params;
		}
		else {
			strParams = OC.buildQueryString(params);
		}
		if (window.history.pushState) {
			var url = location.pathname + '?' + strParams;
			if (replace) {
				window.history.replaceState(params, '', url);
			} else {
				window.history.pushState(params, '', url);
			}
		}
		// use URL hash for IE8
		else {
			window.location.hash = '?' + strParams;
			// inhibit next onhashchange that just added itself
			// to the event queue
			this._cancelPop = true;
		}
	},

	/**
	 * Push the current URL parameters to the history stack
	 * and change the visible URL.
	 * Note: this includes a workaround for IE8/IE9 that uses
	 * the hash part instead of the search part.
	 *
	 * @param params to append to the URL, can be either a string
	 * or a map
	 */
	pushState: function (params) {
		return this._pushState(params, false);
	},

	/**
	 * Push the current URL parameters to the history stack
	 * and change the visible URL.
	 * Note: this includes a workaround for IE8/IE9 that uses
	 * the hash part instead of the search part.
	 *
	 * @param params to append to the URL, can be either a string
	 * or a map
	 */
	replaceState: function (params) {
		return this._pushState(params, true);
	},

	/**
	 * Add a popstate handler
	 *
	 * @param handler function
	 */
	addOnPopStateHandler: function (handler) {
		this._handlers.push(handler);
	},

	/**
	 * Parse a query string from the hash part of the URL.
	 * (workaround for IE8 / IE9)
	 */
	_parseHashQuery: function () {
		var hash = window.location.hash,
			pos = hash.indexOf('?');
		if (pos >= 0) {
			return hash.substr(pos + 1);
		}
		if (hash.length) {
			// remove hash sign
			return hash.substr(1);
		}
		return '';
	},

	_decodeQuery: function (query) {
		return query.replace(/\+/g, ' ');
	},

	/**
	 * Parse the query/search part of the URL.
	 * Also try and parse it from the URL hash (for IE8)
	 *
	 * @return map of parameters
	 */
	parseUrlQuery: function () {
		var query = this._parseHashQuery(),
			params;
		// try and parse from URL hash first
		if (query) {
			params = OC.parseQueryString(this._decodeQuery(query));
		}
		// else read from query attributes
		params = _.extend(params || {}, OC.parseQueryString(this._decodeQuery(location.search)));
		return params || {};
	},

	_onPopState: function (e) {
		if (this._cancelPop) {
			this._cancelPop = false;
			return;
		}
		var params;
		if (!this._handlers.length) {
			return;
		}
		params = (e && e.state);
		if (_.isString(params)) {
			params = OC.parseQueryString(params);
		} else if (!params) {
			params = this.parseUrlQuery() || {};
		}
		for (var i = 0; i < this._handlers.length; i++) {
			this._handlers[i](params);
		}
	}
};

// fallback to hashchange when no history support
if (window.history.pushState) {
	window.onpopstate = _.bind(OC.Util.History._onPopState, OC.Util.History);
}
else {
	$(window).on('hashchange', _.bind(OC.Util.History._onPopState, OC.Util.History));
}

/**
 * Get a variable by name
 * @param {string} name
 * @return {*}
 */
OC.get = function (name) {
	var namespaces = name.split(".");
	var tail = namespaces.pop();
	var context = window;

	for (var i = 0; i < namespaces.length; i++) {
		context = context[namespaces[i]];
		if (!context) {
			return false;
		}
	}
	return context[tail];
};

/**
 * Set a variable by name
 * @param {string} name
 * @param {*} value
 */
OC.set = function (name, value) {
	var namespaces = name.split(".");
	var tail = namespaces.pop();
	var context = window;

	for (var i = 0; i < namespaces.length; i++) {
		if (!context[namespaces[i]]) {
			context[namespaces[i]] = {};
		}
		context = context[namespaces[i]];
	}
	context[tail] = value;
};

// fix device width on windows phone
(function () {
	if ("-ms-user-select" in document.documentElement.style && navigator.userAgent.match(/IEMobile\/10\.0/)) {
		var msViewportStyle = document.createElement("style");
		msViewportStyle.appendChild(
			document.createTextNode("@-ms-viewport{width:auto!important}")
		);
		document.getElementsByTagName("head")[0].appendChild(msViewportStyle);
	}
})();

/**
 * Namespace for apps
 * @namespace OCA
 */
window.OCA = {};

/**
 * select a range in an input field
 * @link http://stackoverflow.com/questions/499126/jquery-set-cursor-position-in-text-area
 * @param {type} start
 * @param {type} end
 */
jQuery.fn.selectRange = function (start, end) {
	return this.each(function () {
		if (this.setSelectionRange) {
			this.focus();
			this.setSelectionRange(start, end);
		} else if (this.createTextRange) {
			var range = this.createTextRange();
			range.collapse(true);
			range.moveEnd('character', end);
			range.moveStart('character', start);
			range.select();
		}
	});
};

/**
 * check if an element exists.
 * allows you to write if ($('#myid').exists()) to increase readability
 * @link http://stackoverflow.com/questions/31044/is-there-an-exists-function-for-jquery
 */
jQuery.fn.exists = function () {
	return this.length > 0;
};

/**
 * @deprecated use OC.Util.getScrollBarWidth() instead
 */
function getScrollBarWidth() {
	return OC.Util.getScrollBarWidth();
}

/**
 * jQuery tipsy shim for the bootstrap tooltip
 */
jQuery.fn.tipsy = function (argument) {
	console.warn('Deprecation warning: tipsy is deprecated. Use tooltip instead.');
	if (typeof argument === 'object' && argument !== null) {

		// tipsy defaults
		var options = {
			placement: 'bottom',
			delay: {'show': 0, 'hide': 0},
			trigger: 'hover',
			html: false,
			container: 'body'
		};
		if (argument.gravity) {
			switch (argument.gravity) {
				case 'n':
				case 'nw':
				case 'ne':
					options.placement = 'bottom';
					break;
				case 's':
				case 'sw':
				case 'se':
					options.placement = 'top';
					break;
				case 'w':
					options.placement = 'right';
					break;
				case 'e':
					options.placement = 'left';
					break;
			}
		}
		if (argument.trigger) {
			options.trigger = argument.trigger;
		}
		if (argument.delayIn) {
			options.delay["show"] = argument.delayIn;
		}
		if (argument.delayOut) {
			options.delay["hide"] = argument.delayOut;
		}
		if (argument.html) {
			options.html = true;
		}
		if (argument.fallback) {
			options.title = argument.fallback;
		}
		// destroy old tooltip in case the title has changed
		jQuery.fn.tooltip.call(this, 'destroy');
		jQuery.fn.tooltip.call(this, options);
	} else {
		this.tooltip(argument);
		jQuery.fn.tooltip.call(this, argument);
	}
	return this;
}

jQuery.extend = jQuery.fn.extend = function() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;

		// Skip the boolean and the target
		target = arguments[ i ] || {};
		i++;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	// Extend jQuery itself if only one argument is passed
	if ( i === length ) {
		target = this;
		i--;
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( name === "__proto__" || target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && jQuery.isArray(src) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

					// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

function isWindow( obj ) {
	return obj != null && obj === obj.window;
}

function getDimensions( elem ) {
	var raw = elem[ 0 ];
	if ( raw.nodeType === 9 ) {
		return {
			width: elem.width(),
			height: elem.height(),
			offset: { top: 0, left: 0 }
		};
	}
	if ( isWindow( raw ) ) {
		return {
			width: elem.width(),
			height: elem.height(),
			offset: { top: elem.scrollTop(), left: elem.scrollLeft() }
		};
	}
	if ( raw.preventDefault ) {
		return {
			width: 0,
			height: 0,
			offset: { top: raw.pageY, left: raw.pageX }
		};
	}
	return {
		width: elem.outerWidth(),
		height: elem.outerHeight(),
		offset: elem.offset()
	};
}

var _position = $.fn.position,
	max = Math.max,
	abs = Math.abs,
	rhorizontal = /left|center|right/,
	rvertical = /top|center|bottom/,
	roffset = /[\+\-]\d+(\.[\d]+)?%?/,
	rposition = /^\w+/,
	rpercent = /%$/;

function getOffsets( offsets, width, height ) {
	return [
		parseFloat( offsets[ 0 ] ) * ( rpercent.test( offsets[ 0 ] ) ? width / 100 : 1 ),
		parseFloat( offsets[ 1 ] ) * ( rpercent.test( offsets[ 1 ] ) ? height / 100 : 1 )
	];
}

function parseCss( element, property ) {
	return parseInt( $.css( element, property ), 10 ) || 0;
}

$.fn.position = function( options ) {
	if ( !options || !options.of ) {
		return _position.apply( this, arguments );
	}

	// Make a copy, we don't want to modify arguments
	options = $.extend( {}, options );

	var atOffset, targetWidth, targetHeight, targetOffset, basePosition, dimensions,

		// Make sure string options are treated as CSS selectors
		target = typeof options.of === "string" ?
			$( document ).find( options.of ) :
			$( options.of ),

		within = $.position.getWithinInfo( options.within ),
		scrollInfo = $.position.getScrollInfo( within ),
		collision = ( options.collision || "flip" ).split( " " ),
		offsets = {};

	dimensions = getDimensions( target );
	if ( target[ 0 ].preventDefault ) {

		// Force left top to allow flipping
		options.at = "left top";
	}
	targetWidth = dimensions.width;
	targetHeight = dimensions.height;
	targetOffset = dimensions.offset;

	// Clone to reuse original targetOffset later
	basePosition = $.extend( {}, targetOffset );

	// Force my and at to have valid horizontal and vertical positions
	// if a value is missing or invalid, it will be converted to center
	$.each( [ "my", "at" ], function() {
		var pos = ( options[ this ] || "" ).split( " " ),
			horizontalOffset,
			verticalOffset;

		if ( pos.length === 1 ) {
			pos = rhorizontal.test( pos[ 0 ] ) ?
				pos.concat( [ "center" ] ) :
				rvertical.test( pos[ 0 ] ) ?
					[ "center" ].concat( pos ) :
					[ "center", "center" ];
		}
		pos[ 0 ] = rhorizontal.test( pos[ 0 ] ) ? pos[ 0 ] : "center";
		pos[ 1 ] = rvertical.test( pos[ 1 ] ) ? pos[ 1 ] : "center";

		// Calculate offsets
		horizontalOffset = roffset.exec( pos[ 0 ] );
		verticalOffset = roffset.exec( pos[ 1 ] );
		offsets[ this ] = [
			horizontalOffset ? horizontalOffset[ 0 ] : 0,
			verticalOffset ? verticalOffset[ 0 ] : 0
		];

		// Reduce to just the positions without the offsets
		options[ this ] = [
			rposition.exec( pos[ 0 ] )[ 0 ],
			rposition.exec( pos[ 1 ] )[ 0 ]
		];
	} );

	// Normalize collision option
	if ( collision.length === 1 ) {
		collision[ 1 ] = collision[ 0 ];
	}

	if ( options.at[ 0 ] === "right" ) {
		basePosition.left += targetWidth;
	} else if ( options.at[ 0 ] === "center" ) {
		basePosition.left += targetWidth / 2;
	}

	if ( options.at[ 1 ] === "bottom" ) {
		basePosition.top += targetHeight;
	} else if ( options.at[ 1 ] === "center" ) {
		basePosition.top += targetHeight / 2;
	}

	atOffset = getOffsets( offsets.at, targetWidth, targetHeight );
	basePosition.left += atOffset[ 0 ];
	basePosition.top += atOffset[ 1 ];

	return this.each( function() {
		var collisionPosition, using,
			elem = $( this ),
			elemWidth = elem.outerWidth(),
			elemHeight = elem.outerHeight(),
			marginLeft = parseCss( this, "marginLeft" ),
			marginTop = parseCss( this, "marginTop" ),
			collisionWidth = elemWidth + marginLeft + parseCss( this, "marginRight" ) +
				scrollInfo.width,
			collisionHeight = elemHeight + marginTop + parseCss( this, "marginBottom" ) +
				scrollInfo.height,
			position = $.extend( {}, basePosition ),
			myOffset = getOffsets( offsets.my, elem.outerWidth(), elem.outerHeight() );

		if ( options.my[ 0 ] === "right" ) {
			position.left -= elemWidth;
		} else if ( options.my[ 0 ] === "center" ) {
			position.left -= elemWidth / 2;
		}

		if ( options.my[ 1 ] === "bottom" ) {
			position.top -= elemHeight;
		} else if ( options.my[ 1 ] === "center" ) {
			position.top -= elemHeight / 2;
		}

		position.left += myOffset[ 0 ];
		position.top += myOffset[ 1 ];

		collisionPosition = {
			marginLeft: marginLeft,
			marginTop: marginTop
		};

		$.each( [ "left", "top" ], function( i, dir ) {
			if ( $.ui.position[ collision[ i ] ] ) {
				$.ui.position[ collision[ i ] ][ dir ]( position, {
					targetWidth: targetWidth,
					targetHeight: targetHeight,
					elemWidth: elemWidth,
					elemHeight: elemHeight,
					collisionPosition: collisionPosition,
					collisionWidth: collisionWidth,
					collisionHeight: collisionHeight,
					offset: [ atOffset[ 0 ] + myOffset[ 0 ], atOffset [ 1 ] + myOffset[ 1 ] ],
					my: options.my,
					at: options.at,
					within: within,
					elem: elem
				} );
			}
		} );

		if ( options.using ) {

			// Adds feedback as second argument to using callback, if present
			using = function( props ) {
				var left = targetOffset.left - position.left,
					right = left + targetWidth - elemWidth,
					top = targetOffset.top - position.top,
					bottom = top + targetHeight - elemHeight,
					feedback = {
						target: {
							element: target,
							left: targetOffset.left,
							top: targetOffset.top,
							width: targetWidth,
							height: targetHeight
						},
						element: {
							element: elem,
							left: position.left,
							top: position.top,
							width: elemWidth,
							height: elemHeight
						},
						horizontal: right < 0 ? "left" : left > 0 ? "right" : "center",
						vertical: bottom < 0 ? "top" : top > 0 ? "bottom" : "middle"
					};
				if ( targetWidth < elemWidth && abs( left + right ) < targetWidth ) {
					feedback.horizontal = "center";
				}
				if ( targetHeight < elemHeight && abs( top + bottom ) < targetHeight ) {
					feedback.vertical = "middle";
				}
				if ( max( abs( left ), abs( right ) ) > max( abs( top ), abs( bottom ) ) ) {
					feedback.important = "horizontal";
				} else {
					feedback.important = "vertical";
				}
				options.using.call( this, props, feedback );
			};
		}

		elem.offset( $.extend( position, { using: using } ) );
	} );
};

$.datepicker._attachments = function (input, inst) {
		var showOn, buttonText, buttonImage,
			appendText = this._get(inst, "appendText"),
			isRTL = this._get(inst, "isRTL");

		if (inst.append) {
			inst.append.remove();
		}
		if (appendText) {
			inst.append = $("<span>")
				.addClass(this._appendClass)
				.text(appendText);
			input[isRTL ? "before" : "after"](inst.append);
		}

		input.off("focus", this._showDatepicker);

		if (inst.trigger) {
			inst.trigger.remove();
		}

		showOn = this._get(inst, "showOn");
		if (showOn === "focus" || showOn === "both") { // pop-up date picker when in the marked field
			input.on("focus", this._showDatepicker);
		}
		if (showOn === "button" || showOn === "both") { // pop-up date picker when button clicked
			buttonText = this._get(inst, "buttonText");
			buttonImage = this._get(inst, "buttonImage");

			if (this._get(inst, "buttonImageOnly")) {
				inst.trigger = $("<img>")
					.addClass(this._triggerClass)
					.attr({
						src: buttonImage,
						alt: buttonText,
						title: buttonText
					});
			} else {
				inst.trigger = $("<button type='button'>")
					.addClass(this._triggerClass);
				if (buttonImage) {
					inst.trigger.html(
						$("<img>")
							.attr({
								src: buttonImage,
								alt: buttonText,
								title: buttonText
							})
					);
				} else {
					inst.trigger.text(buttonText);
				}
			}

			input[isRTL ? "before" : "after"](inst.trigger);
			inst.trigger.on("click", function () {
				if ($.datepicker._datepickerShowing && $.datepicker._lastInput === input[0]) {
					$.datepicker._hideDatepicker();
				} else if ($.datepicker._datepickerShowing && $.datepicker._lastInput !== input[0]) {
					$.datepicker._hideDatepicker();
					$.datepicker._showDatepicker(input[0]);
				} else {
					$.datepicker._showDatepicker(input[0]);
				}
				return false;
			});
		}
	};
	$.datepicker._generateHTML = function( inst ) {
		var maxDraw, prevText, prev, nextText, next, currentText, gotoDate,
			controls, buttonPanel, firstDay, showWeek, dayNames, dayNamesMin,
			monthNames, monthNamesShort, beforeShowDay, showOtherMonths,
			selectOtherMonths, defaultDate, html, dow, row, group, col, selectedDate,
			cornerClass, calender, thead, day, daysInMonth, leadDays, curRows, numRows,
			printDate, dRow, tbody, daySettings, otherMonth, unselectable,
			tempDate = new Date(),
			today = this._daylightSavingAdjust(
				new Date( tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate() ) ), // clear time
			isRTL = this._get( inst, "isRTL" ),
			showButtonPanel = this._get( inst, "showButtonPanel" ),
			hideIfNoPrevNext = this._get( inst, "hideIfNoPrevNext" ),
			navigationAsDateFormat = this._get( inst, "navigationAsDateFormat" ),
			numMonths = this._getNumberOfMonths( inst ),
			showCurrentAtPos = this._get( inst, "showCurrentAtPos" ),
			stepMonths = this._get( inst, "stepMonths" ),
			isMultiMonth = ( numMonths[ 0 ] !== 1 || numMonths[ 1 ] !== 1 ),
			currentDate = this._daylightSavingAdjust( ( !inst.currentDay ? new Date( 9999, 9, 9 ) :
				new Date( inst.currentYear, inst.currentMonth, inst.currentDay ) ) ),
			minDate = this._getMinMaxDate( inst, "min" ),
			maxDate = this._getMinMaxDate( inst, "max" ),
			drawMonth = inst.drawMonth - showCurrentAtPos,
			drawYear = inst.drawYear;

		if ( drawMonth < 0 ) {
			drawMonth += 12;
			drawYear--;
		}
		if ( maxDate ) {
			maxDraw = this._daylightSavingAdjust( new Date( maxDate.getFullYear(),
				maxDate.getMonth() - ( numMonths[ 0 ] * numMonths[ 1 ] ) + 1, maxDate.getDate() ) );
			maxDraw = ( minDate && maxDraw < minDate ? minDate : maxDraw );
			while ( this._daylightSavingAdjust( new Date( drawYear, drawMonth, 1 ) ) > maxDraw ) {
				drawMonth--;
				if ( drawMonth < 0 ) {
					drawMonth = 11;
					drawYear--;
				}
			}
		}
		inst.drawMonth = drawMonth;
		inst.drawYear = drawYear;

		prevText = this._get( inst, "prevText" );
		prevText = ( !navigationAsDateFormat ? prevText : this.formatDate( prevText,
			this._daylightSavingAdjust( new Date( drawYear, drawMonth - stepMonths, 1 ) ),
			this._getFormatConfig( inst ) ) );

		if ( this._canAdjustMonth( inst, -1, drawYear, drawMonth ) ) {
			prev = $( "<a>" )
				.attr( {
					"class": "ui-datepicker-prev ui-corner-all",
					"data-handler": "prev",
					"data-event": "click",
					title: prevText
				} )
				.append(
					$( "<span>" )
						.addClass( "ui-icon ui-icon-circle-triangle-" +
							( isRTL ? "e" : "w" ) )
						.text( prevText )
				)[ 0 ].outerHTML;
		} else if ( hideIfNoPrevNext ) {
			prev = "";
		} else {
			prev = $( "<a>" )
				.attr( {
					"class": "ui-datepicker-prev ui-corner-all ui-state-disabled",
					title: prevText
				} )
				.append(
					$( "<span>" )
						.addClass( "ui-icon ui-icon-circle-triangle-" +
							( isRTL ? "e" : "w" ) )
						.text( prevText )
				)[ 0 ].outerHTML;
		}

		nextText = this._get( inst, "nextText" );
		nextText = ( !navigationAsDateFormat ? nextText : this.formatDate( nextText,
			this._daylightSavingAdjust( new Date( drawYear, drawMonth + stepMonths, 1 ) ),
			this._getFormatConfig( inst ) ) );

		if ( this._canAdjustMonth( inst, +1, drawYear, drawMonth ) ) {
			next = $( "<a>" )
				.attr( {
					"class": "ui-datepicker-next ui-corner-all",
					"data-handler": "next",
					"data-event": "click",
					title: nextText
				} )
				.append(
					$( "<span>" )
						.addClass( "ui-icon ui-icon-circle-triangle-" +
							( isRTL ? "w" : "e" ) )
						.text( nextText )
				)[ 0 ].outerHTML;
		} else if ( hideIfNoPrevNext ) {
			next = "";
		} else {
			next = $( "<a>" )
				.attr( {
					"class": "ui-datepicker-next ui-corner-all ui-state-disabled",
					title: nextText
				} )
				.append(
					$( "<span>" )
						.attr( "class", "ui-icon ui-icon-circle-triangle-" +
							( isRTL ? "w" : "e" ) )
						.text( nextText )
				)[ 0 ].outerHTML;
		}

		currentText = this._get( inst, "currentText" );
		gotoDate = ( this._get( inst, "gotoCurrent" ) && inst.currentDay ? currentDate : today );
		currentText = ( !navigationAsDateFormat ? currentText :
			this.formatDate( currentText, gotoDate, this._getFormatConfig( inst ) ) );

		controls = "";
		if ( !inst.inline ) {
			controls = $( "<button>" )
				.attr( {
					type: "button",
					"class": "ui-datepicker-close ui-state-default ui-priority-primary ui-corner-all",
					"data-handler": "hide",
					"data-event": "click"
				} )
				.text( this._get( inst, "closeText" ) )[ 0 ].outerHTML;
		}

		buttonPanel = "";
		if ( showButtonPanel ) {
			buttonPanel = $( "<div class='ui-datepicker-buttonpane ui-widget-content'>" )
				.append( isRTL ? controls : "" )
				.append( this._isInRange( inst, gotoDate ) ?
					$( "<button>" )
						.attr( {
							type: "button",
							"class": "ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all",
							"data-handler": "today",
							"data-event": "click"
						} )
						.text( currentText ) :
					"" )
				.append( isRTL ? "" : controls )[ 0 ].outerHTML;
		}

		firstDay = parseInt( this._get( inst, "firstDay" ), 10 );
		firstDay = ( isNaN( firstDay ) ? 0 : firstDay );

		showWeek = this._get( inst, "showWeek" );
		dayNames = this._get( inst, "dayNames" );
		dayNamesMin = this._get( inst, "dayNamesMin" );
		monthNames = this._get( inst, "monthNames" );
		monthNamesShort = this._get( inst, "monthNamesShort" );
		beforeShowDay = this._get( inst, "beforeShowDay" );
		showOtherMonths = this._get( inst, "showOtherMonths" );
		selectOtherMonths = this._get( inst, "selectOtherMonths" );
		defaultDate = this._getDefaultDate( inst );
		html = "";

		for ( row = 0; row < numMonths[ 0 ]; row++ ) {
			group = "";
			this.maxRows = 4;
			for ( col = 0; col < numMonths[ 1 ]; col++ ) {
				selectedDate = this._daylightSavingAdjust( new Date( drawYear, drawMonth, inst.selectedDay ) );
				cornerClass = " ui-corner-all";
				calender = "";
				if ( isMultiMonth ) {
					calender += "<div class='ui-datepicker-group";
					if ( numMonths[ 1 ] > 1 ) {
						switch ( col ) {
							case 0: calender += " ui-datepicker-group-first";
								cornerClass = " ui-corner-" + ( isRTL ? "right" : "left" ); break;
							case numMonths[ 1 ] - 1: calender += " ui-datepicker-group-last";
								cornerClass = " ui-corner-" + ( isRTL ? "left" : "right" ); break;
							default: calender += " ui-datepicker-group-middle"; cornerClass = ""; break;
						}
					}
					calender += "'>";
				}
				calender += "<div class='ui-datepicker-header ui-widget-header ui-helper-clearfix" + cornerClass + "'>" +
					( /all|left/.test( cornerClass ) && row === 0 ? ( isRTL ? next : prev ) : "" ) +
					( /all|right/.test( cornerClass ) && row === 0 ? ( isRTL ? prev : next ) : "" ) +
					this._generateMonthYearHeader( inst, drawMonth, drawYear, minDate, maxDate,
						row > 0 || col > 0, monthNames, monthNamesShort ) + // draw month headers
					"</div><table class='ui-datepicker-calendar'><thead>" +
					"<tr>";
				thead = ( showWeek ? "<th class='ui-datepicker-week-col'>" + this._get( inst, "weekHeader" ) + "</th>" : "" );
				for ( dow = 0; dow < 7; dow++ ) { // days of the week
					day = ( dow + firstDay ) % 7;
					thead += "<th scope='col'" + ( ( dow + firstDay + 6 ) % 7 >= 5 ? " class='ui-datepicker-week-end'" : "" ) + ">" +
						"<span title='" + dayNames[ day ] + "'>" + dayNamesMin[ day ] + "</span></th>";
				}
				calender += thead + "</tr></thead><tbody>";
				daysInMonth = this._getDaysInMonth( drawYear, drawMonth );
				if ( drawYear === inst.selectedYear && drawMonth === inst.selectedMonth ) {
					inst.selectedDay = Math.min( inst.selectedDay, daysInMonth );
				}
				leadDays = ( this._getFirstDayOfMonth( drawYear, drawMonth ) - firstDay + 7 ) % 7;
				curRows = Math.ceil( ( leadDays + daysInMonth ) / 7 ); // calculate the number of rows to generate
				numRows = ( isMultiMonth ? this.maxRows > curRows ? this.maxRows : curRows : curRows ); //If multiple months, use the higher number of rows (see #7043)
				this.maxRows = numRows;
				printDate = this._daylightSavingAdjust( new Date( drawYear, drawMonth, 1 - leadDays ) );
				for ( dRow = 0; dRow < numRows; dRow++ ) { // create date picker rows
					calender += "<tr>";
					tbody = ( !showWeek ? "" : "<td class='ui-datepicker-week-col'>" +
						this._get( inst, "calculateWeek" )( printDate ) + "</td>" );
					for ( dow = 0; dow < 7; dow++ ) { // create date picker days
						daySettings = ( beforeShowDay ?
							beforeShowDay.apply( ( inst.input ? inst.input[ 0 ] : null ), [ printDate ] ) : [ true, "" ] );
						otherMonth = ( printDate.getMonth() !== drawMonth );
						unselectable = ( otherMonth && !selectOtherMonths ) || !daySettings[ 0 ] ||
							( minDate && printDate < minDate ) || ( maxDate && printDate > maxDate );
						tbody += "<td class='" +
							( ( dow + firstDay + 6 ) % 7 >= 5 ? " ui-datepicker-week-end" : "" ) + // highlight weekends
							( otherMonth ? " ui-datepicker-other-month" : "" ) + // highlight days from other months
							( ( printDate.getTime() === selectedDate.getTime() && drawMonth === inst.selectedMonth && inst._keyEvent ) || // user pressed key
							( defaultDate.getTime() === printDate.getTime() && defaultDate.getTime() === selectedDate.getTime() ) ?

								// or defaultDate is current printedDate and defaultDate is selectedDate
								" " + this._dayOverClass : "" ) + // highlight selected day
							( unselectable ? " " + this._unselectableClass + " ui-state-disabled" : "" ) +  // highlight unselectable days
							( otherMonth && !showOtherMonths ? "" : " " + daySettings[ 1 ] + // highlight custom dates
								( printDate.getTime() === currentDate.getTime() ? " " + this._currentClass : "" ) + // highlight selected day
								( printDate.getTime() === today.getTime() ? " ui-datepicker-today" : "" ) ) + "'" + // highlight today (if different)
							( ( !otherMonth || showOtherMonths ) && daySettings[ 2 ] ? " title='" + daySettings[ 2 ].replace( /'/g, "&#39;" ) + "'" : "" ) + // cell title
							( unselectable ? "" : " data-handler='selectDay' data-event='click' data-month='" + printDate.getMonth() + "' data-year='" + printDate.getFullYear() + "'" ) + ">" + // actions
							( otherMonth && !showOtherMonths ? "&#xa0;" : // display for other months
								( unselectable ? "<span class='ui-state-default'>" + printDate.getDate() + "</span>" : "<a class='ui-state-default" +
									( printDate.getTime() === today.getTime() ? " ui-state-highlight" : "" ) +
									( printDate.getTime() === currentDate.getTime() ? " ui-state-active" : "" ) + // highlight selected day
									( otherMonth ? " ui-priority-secondary" : "" ) + // distinguish dates from other months
									"' href='#'>" + printDate.getDate() + "</a>" ) ) + "</td>"; // display selectable date
						printDate.setDate( printDate.getDate() + 1 );
						printDate = this._daylightSavingAdjust( printDate );
					}
					calender += tbody + "</tr>";
				}
				drawMonth++;
				if ( drawMonth > 11 ) {
					drawMonth = 0;
					drawYear++;
				}
				calender += "</tbody></table>" + ( isMultiMonth ? "</div>" +
					( ( numMonths[ 0 ] > 0 && col === numMonths[ 1 ] - 1 ) ? "<div class='ui-datepicker-row-break'></div>" : "" ) : "" );
				group += calender;
			}
			html += group;
		}
		html += buttonPanel;
		inst._keyEvent = false;
		return html;
	};
	$.datepicker._updateAlternate = function( inst ) {
		var altFormat, date, dateStr,
			altField = this._get( inst, "altField" );
		if ( altField ) { // update alternate field too
			altFormat = this._get( inst, "altFormat" ) || this._get( inst, "dateFormat" );
			date = this._getDate( inst );
			dateStr = this.formatDate( altFormat, date, this._getFormatConfig( inst ) );
			$( altField ).val( dateStr );
			$( document ).find( altField ).val( dateStr );
		}
	};

	$.ui.dialog._setOption = function( key, value ) {
		if (key === "disabled") {
			return;
		}
		this._super(key, value);
		if (key === "appendTo") {
			this.uiDialog.appendTo(this._appendTo());
		}
		if (key === "buttons") {
			this._createButtons();
		}
		if (key === "closeText") {
			this.uiDialogTitlebarClose.button({
				// Ensure that we always pass a string
				label: $("<a>").text("" + this.options.closeText).html()
			});
		}
	};

	$.ui.dialog.dialog_createTitlebar = function() {
	var uiDialogTitle;
	this.uiDialogTitlebar = $( "<div>" );
	this._addClass( this.uiDialogTitlebar,
		"ui-dialog-titlebar", "ui-widget-header ui-helper-clearfix" );
	this._on( this.uiDialogTitlebar, {
		mousedown: function( event ) {
			// Don't prevent click on close button (#8838)
			// Focusing a dialog that is partially scrolled out of view
			// causes the browser to scroll it into view, preventing the click event
			if ( !$( event.target ).closest( ".ui-dialog-titlebar-close" ) ) {
				// Dialog isn't getting focus when dragging (#8063)
				this.uiDialog.trigger( "focus" );
			}
		}
	} );
	// Support: IE
	// Use type="button" to prevent enter keypresses in textboxes from closing the
	// dialog in IE (#9312)
	this.uiDialogTitlebarClose = $( "<button type='button'></button>" )
		.button( {
			label: $( "<a>" ).text( this.options.closeText ).html(),
			icon: "ui-icon-closethick",
			showLabel: false
		} )
		.appendTo( this.uiDialogTitlebar );
	this._addClass( this.uiDialogTitlebarClose, "ui-dialog-titlebar-close" );
	this._on( this.uiDialogTitlebarClose, {
		click: function( event ) {
			event.preventDefault();
			this.close( event );
		}
	} );
	uiDialogTitle = $( "<span>" ).uniqueId().prependTo( this.uiDialogTitlebar );
	this._addClass( uiDialogTitle, "ui-dialog-title" );
	this._title( uiDialogTitle );
	this.uiDialogTitlebar.prependTo( this.uiDialog );
	this.uiDialog.attr( {
		"aria-labelledby": uiDialogTitle.attr( "id" )
	} );
};
