/**
 * --------------------------------------------------------------------------
 * QuerySet (v1.0.0): queryset.js
 * Licensed under MIT (https://github.com/Worldrider/queryset/blob/master/LICENSE.txt)
 * --------------------------------------------------------------------------
 */
"use strict";

class QuerySet extends Array {
    /*
    * Data structure with Django QuerySet-like syntax
    * to manipulate Django Rest Framework ViewSet response
    *
    * NOTE: date comparisons depend on moment.js
    * e.g. qs.exclude({invoices__date__lte: "15/03/2019"})
    *
    * TODO:
    * - values_list flat option (right now it is always flat)
    * - add exceptions on invalid queries
    * - support multiple separators ?
    * - handle dates independently from moment.js ?
    */

    constructor() {
        let initial = []
        if (arguments.length == 1 && Array.isArray(arguments[0])) {
            for (var i = 0; i < arguments[0].length; i++) {
                initial.push(arguments[0][i])
            }
        } else {
            initial = Array.from(arguments)
        }
        super(...initial)
        this.setConfig()
    }
    setConfig (config) {
        /*
        * Set options
        */
        this.separator = config && config.separator ? config.separator : "__"
        // NOTE: date comparisons depend on moment.js
        if (window.moment) {
            this.date_formats = config && config.date_formats ? config.date_formats : [
                "DD/MM/YYYY",
                "DD-MM-YYYY",
                "DD.MM.YYYY",
                "DD/MM/YYYY HH:mm",
                "DD-MM-YYYY HH:mm",
                "DD.MM.YYYY HH:mm",
                "YYYY-MM-DDThh:mm:ss",
                "YYYY/MM/DD",
                "YYYY-MM-DD",
                "YYYY.MM.DD",
                "YYYY/MM/DD HH:mm",
                "YYYY-MM-DD HH:mm",
                "YYYY.MM.DD HH:mm",
            ]
        }
    }
    get (query) {
        /*
        * Get by id or find by condition
        *
        * query could be id or dictionary
        */
        if (!query) {
            return null;
        }
        if (Number.isInteger(query) || query.constructor === String) {
            for (var i = 0; i < this.length; i++) {
                if (QuerySet.get_pk(this[i]) == parseInt(query)) {
                    return this[i];
                }
            }
        } else {
            return this.filter(query).first()
        }
        return null;
    }
    update (data) {
        /*
        * Update set of fields on all objects in QuerySet
        */
        if (QuerySet.get_pk(data)) {
            for (var i = 0; i < this.length; i++) {
                for (var field in data) {
                    if (data.hasOwnProperty(field)) {
                        this[i][field] = data[field]
                    }
                }
            }
        }
    }
    getFilter (item, query, match, separator, date_formats) {
        /*
        * Get filter function for Array.filter
        */
        function isEmpty (obj) {
            if (obj == null) {
                return true
            }
            if (Array.isArray(obj) && obj.length == 0) {
                return true
            }
            if (obj.constructor === Object) {
                for(var prop in obj) {
                    if(obj.hasOwnProperty(prop)) {
                        return false;
                    }
                }
                return JSON.stringify(obj) === JSON.stringify({});
            }
            return false
        }
        function getMatch (obj, path, value) {
            for (var i = 0; i < path.length; i++) {
                var key = path[i]
                if (obj.hasOwnProperty(key) || ((key == "id" || key == "pk") && QuerySet.get_pk(obj))) {
                    // automatically check both 'id' or 'pk' if either present in parameters
                    if (key == "id" || key == "pk") {
                        obj = QuerySet.get_pk(obj)
                    } else {
                        obj = obj[key]
                    }
                    if (Array.isArray(obj)) {
                        if (path.length - 1 == i + 1 && path[i + 1] == "isnull") {
                            if (value == true) {
                                return isEmpty(obj)
                            } else if (value == false) {
                                return !isEmpty(obj)
                            }
                        }
                        if (i == path.length - 1) {
                            if (value == null) {
                                return isEmpty(obj)
                            }
                        }
                        var nested_path = path.slice(i + 1)
                        for (var j = 0; j < obj.length; j++) {
                            return getMatch(obj[j], nested_path, value)
                        }
                    } else {
                        if (path.length - 1 == i + 1 && path[i + 1] == "isnull") {
                            if (value == true) {
                                return isEmpty(obj)
                            } else if (value == false) {
                                return !isEmpty(obj)
                            }
                        }
                        if (i == path.length - 1) {
                            if (obj == value) {
                                return true
                            }
                        }
                    }
                } else {
                    if (path[path.length - 1] == "isnull") {
                        if (value == true) {
                            return true
                        } else if (value == false) {
                            return false
                        }
                    }
                    if (i == path.length - 1) {
                        if (key == "not") {
                            if (value == null) {
                                return !isEmpty(obj)
                            } else {
                                if (obj != value) {
                                    return true
                                }
                            }
                        } else if (key == "isnull") {
                            if (value == true) {
                                return isEmpty(obj)
                            } else if (value == false) {
                                return !isEmpty(obj)
                            }
                        } else if (key == "icontains") {
                            if (obj != null && obj.constructor === String && value != null && value.constructor === String) {
                                if (obj.trim().toLowerCase().indexOf(value.trim().toLowerCase()) !== -1) {
                                    return true
                                }
                            }
                        } else if (key == "iexact") {
                            if (obj != null && obj.constructor === String && value != null && value.constructor === String) {
                                if (obj.trim() == value.trim()) {
                                    return true
                                }
                            }
                        } else if (key == "in") {
                            if (value != null && Array.isArray(value)) {
                                for (var k = 0; k < value.length; k++) {
                                    if (obj == value[k]) {
                                        return true
                                    }
                                }
                            }
                        } else if (key == "not_in") {
                            if (value != null && Array.isArray(value)) {
                                for (var k = 0; k < value.length; k++) {
                                    if (obj == value[k]) {
                                        return false
                                    }
                                }
                                return true
                            }
                        } else if (key == "lt") {
                            if (value != null) {
                                var a = QuerySet.parseDate(obj, date_formats)
                                var b = QuerySet.parseDate(value, date_formats)
                                if (a && b) {
                                    if (a < b) {
                                        return true
                                    }
                                } else if (obj < value) {
                                    return true
                                }
                            }
                        } else if (key == "lte") {
                            if (value != null) {
                                var a = QuerySet.parseDate(obj, date_formats)
                                var b = QuerySet.parseDate(value, date_formats)
                                if (a && b) {
                                    if (a <= b) {
                                        return true
                                    }
                                } else if (obj <= value) {
                                    return true
                                }
                            }
                        } else if (key == "gt") {
                            if (value != null) {
                                var a = QuerySet.parseDate(obj, date_formats)
                                var b = QuerySet.parseDate(value, date_formats)
                                if (a && b) {
                                    if (a > b) {
                                        return true
                                    }
                                } else if (obj > value) {
                                    return true
                                }
                            }
                        } else if (key == "gte") {
                            if (value != null) {
                                var a = QuerySet.parseDate(obj, date_formats)
                                var b = QuerySet.parseDate(value, date_formats)
                                if (a && b) {
                                    if (a >= b) {
                                        return true
                                    }
                                } else if (obj >= value) {
                                    return true
                                }
                            }
                        } else {
                            if (value == null) {
                                return true
                            }
                        }
                    } else {
                        if (path[path.length - 1] != "not" && value == null) {
                            return true
                        }
                    }
                    return false
                }
            }
            return false
        }
        var result = true
        for(var key in query) {
            var path = key.split(separator)
            if (getMatch(item, path, query[key])) {
                if (match) {
                    // return true
                } else {
                    return false
                }
            } else {
                if (match) {
                    return false
                } else {
                    // return true
                }
            }
        }
        return true;
    }
    filter () {
        /*
        * Filter queryset by dictionary of fields and values
        *
        * if pass function as a parameter it work as Array.filter
        *
        * returns new QuerySet
        */
        if (arguments.length == 1 && arguments[0] instanceof Function) {
            return super.filter(arguments[0])
        }
        var query = []
        for (var i = 0; i < arguments.length; i++) {
            query.push(arguments[i])
        }
        if (!query.length) {
            return new QuerySet(this)
        }
        if (!Array.isArray(query)) {
            query = [query]
        }
        var separator = this.separator
        var date_formats = this.date_formats
        var filter = this.getFilter
        return this.filter(function(item) {
            for (var i = 0; i < query.length; i++) {
                if (filter(item, query[i], true, separator, date_formats)) {
                    return true
                }
            }
            return false
        });
    }
    exclude () {
        /*
        * Filter queryset by dictionary of fields and values
        * returns new QuerySet
        */
        var query = []
        for (var i = 0; i < arguments.length; i++) {
            query.push(arguments[i])
        }
        if (!query.length) {
            return new QuerySet(this)
        }
        if (!Array.isArray(query)) {
            query = [query]
        }
        var separator = this.separator
        var date_formats = this.date_formats
        var filter = this.getFilter
        return new QuerySet(this.filter(function(item) {
            for (var i = 0; i < query.length; i++) {
                if (filter(item, query[i], false, separator, date_formats)) {
                    return true
                }
            }
            return false
        }));
    }
    remove (query) {
        /*
        * Get by id or find all by condition and delete from list
        *
        * query could be id or dictionary
        */
        if (!query) {
            return null;
        }
        if (Number.isInteger(query) || query.constructor === String) {
            for (var i = 0; i < this.length; i++) {
                if (QuerySet.get_pk(this[i]) == parseInt(query)) {
                    this.splice(i, 1);
                    return null;
                }
            }
        } else {
            var to_pop = this.filter(query);
            for (var i = 0; i < to_pop.length; i++) {
                this.pop(QuerySet.get_pk(to_delete[i]));
            }
        }
        return null;
    }
    values_list (query) {
        /*
        * Return flat list of values of specific field
        *
        * returns new QuerySet
        *
        * TODO: flat option (right now it is always flat)
        */
        if (!this.length) {
            return []
        }
        var separator = this.separator
        var sub_queries = query.split(separator)
        var values = [];

        function getNested (obj, path, values) {
            for (var i = 0; i < path.length; i++) {
                if (obj.hasOwnProperty(path[i]) || ((path[i] == "id" || path[i] == "pk") && QuerySet.get_pk(obj))) {
                    // automatically check both 'id' or 'pk' if either present in parameters
                    if ((path[i] == "id" || path[i] == "pk") && QuerySet.get_pk(obj)) {
                        obj = QuerySet.get_pk(obj)
                    } else {
                        obj = obj[path[i]]
                    }
                    // obj = obj[path[i]]
                    if (Array.isArray(obj)) {
                        if (i == path.length - 1) {
                            for (var j = 0; j < obj.length; j++) {
                                values.push(obj[j])
                            }
                        } else {
                            var nested_path = path.slice(i + 1)
                            for (var j = 0; j < obj.length; j++) {
                                getNested(obj[j], nested_path, values)
                            }
                        }
                    } else {
                        values.push(obj)
                    }
                } else {
                    break
                }
            }
        }

        for (var i = 0; i < this.length; i++) {
            getNested(this[i], sub_queries, values)
        }

        return new QuerySet(values);
    }
    sum (query) {
        /*
        * Get sum of field in QuerySet
        */
        if (!this.length) {
            return 0
        }
        return this.values_list(query).reduce((total, cuurent) => total + cuurent)
    }
    avg (query) {
        /*
        * Get average of field in QuerySet
        */
        if (!this.length) {
            return 0
        }
        return this.sum(field) / this.length;
    }
    order_by () {
        /*
        * Order QuerySet by field or list of fields
        *
        * ["first_name", "-last_name", ]
        * "-" sign dictates the ordering - accending/deccending
        *
        * returns current QuerySet
        */
        var fields = []
        for (var i = 0; i < arguments.length; i++) {
            fields.push(arguments[i])
        }
        var separator = this.separator
        var date_formats = this.date_formats

        function getNested (obj, path) {
            for (var i = 0; i < path.length; i++) {
                if (obj.hasOwnProperty(path[i]) || ((path[i] == "id" || path[i] == "pk") && QuerySet.get_pk(obj))) {
                    // automatically check both 'id' or 'pk' if either present in parameters
                    if ((path[i] == "id" || path[i] == "pk") && QuerySet.get_pk(obj)) {
                        obj = QuerySet.get_pk(obj)
                    } else {
                        // TODO
                        if (Array.isArray(obj[path[i]])) {
                            return obj
                        }
                        // TODO
                        // if (i == path.length - 1 && obj[path[i]].constructor == Object) {
                        //     return obj
                        // }
                        obj = obj[path[i]]
                    }
                } else {
                    break
                }
            }
            return obj
        }
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            var desc = field[0] == "-"
            this.sort(function(a, b) {
                if (desc) {
                    var path = field.substr(1).split(separator)
                    var x = getNested(b, path)
                    var y = getNested(a, path)
                    if (typeof x === "boolean" && typeof y === "boolean") {
                        return (x === y) ? 0 : x ? -1 : 1;
                    }
                    var date_x = QuerySet.parseDate(x, date_formats)
                    var date_y = QuerySet.parseDate(y, date_formats)
                    if (date_x && date_y) {
                        return (date_x === date_y) ? 0 : date_x > date_y ? 1 : -1
                    }
                    return (x === y) ? 0 : x > y ? 1 : -1
                }
                var path = field.split(separator)
                var x = getNested(b, path)
                var y = getNested(a, path)
                if (typeof x === "boolean" && typeof y === "boolean") {
                    return (x === y) ? 0 : y ? -1 : 1;
                }
                var date_x = QuerySet.parseDate(x, date_formats)
                var date_y = QuerySet.parseDate(y, date_formats)
                if (date_x && date_y) {
                    return (date_x === date_y) ? 0 : date_x < date_y ? 1 : -1
                }
                return (x === y) ? 0 : x < y ? 1 : -1
            });
        }
        return this
    }

    /*
    * For the sake of similarity with Django QuerySet and python list
    */
    add (data) {
        /*
        * Add object to queryset
        */
        this.push(data);
    }
    append (data) {
        /*
        * Add object to queryset
        */
        this.push(data);
    }
    extend (objects) {
        /*
        * Add multiple objects to queryset
        */
        for (var i = 0; i < objects.length; i++) {
            this.push(objects[i]);
        }
    }
    delete () {
        /*
        * Delete all objects in queryset
        */
        while (this.length) {
            this.pop();
        }
    }
    first () {
        /*
        * Return first object in queryset or null
        */
        if (this.length > 0) {
            return this[0];
        }
        return null
    }
    last () {
        /*
        * Return last object in queryset or null
        */
        if (this.length > 0) {
            return this[this.length - 1];
        }
        return null
    }
    exists () {
        /*
        * Return true if queryset has at least 1 object
        */
        return this.length > 1
    }
    count () {
        /*
        * Retrun number of items in queryset
        */
        return this.length
    }
    static parseDate (date, date_formats) {
        /*
        * Parse date from string
        */
        if (!window.moment) {
            return date
        }
        if (date.constructor == Date) {
            return date
        }
        if (date.constructor == String) {
            for (var i = 0; i < date_formats.length; i++) {
                var d = moment(date, date_formats[i])
                if (d.isValid() && d.format(date_formats[i]) == date) {
                    return d.toDate()
                }
            }
        }
        return null
    }
    static get_pk (object) {
        /*
        * Get object id if either 'id' or 'pk' is in object
        *
        * return integer id
        */
        if (object) {
            return object.id ? parseInt(object.id) : object.pk ? parseInt(object.pk) : null;
        }
        return null;
    }
    toArray () {
        return new Array(this)
    }
}
