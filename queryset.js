/**
 * --------------------------------------------------------------------------
 * QuerySet (v1.1.0): queryset.js
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
    * - queries:
    *    - date queries:
    *       - year
    *       - month
    *       - day
    *       - week
    *       - week_day
    *       - quarter
    *       - hour
    *       - minute
    *       - second
    *    - regex
    *    - iregex
    * - chaining date queries: start_date___year__gte=2019
    * - detect properties which include separator: property__including__separator
    * - values_list flat option (right now it is always flat)
    * - add exceptions on invalid queries
    * - support multiple separators ?
    * - handle dates independently from moment.js ?
    * - implement StdDev ?
    * - implement Variance ?
    */

    constructor() {
        super()
        let initial = []
        if (arguments.length == 1 && Array.isArray(arguments[0])) {
            initial = Array.from(arguments[0])
        } else if (arguments.length && arguments[0]) {
            initial = Array.from(arguments)
        }
        for (let i = 0; i < initial.length; i++) {
            this.push(initial[i])
        }
    }
    get separator () {
        return "__"
    }
    get date_formats () {
        return [
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
    static setConfig (config) {
        /*
        * Set QuerySet config
        */
        if (!config) {
            return
        }
        if (config.separator) {
            Object.defineProperty(QuerySet.prototype, "separator", {get: function () {return config.separator}});
        }
        // NOTE: date comparisons depend on moment.js
        if (window.moment && config.date_formats) {
            Object.defineProperty(QuerySet.prototype, "date_formats", {get: function () {return config.date_formats}});
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
            for (let i = 0; i < this.length; i++) {
                if (QuerySet.get_pk(this[i]) == query.toString()) {
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
        * or one particular object if data contains 'id' or 'pk'
        */
        if (QuerySet.get_pk(data)) {
            let object = this.get(QuerySet.get_pk(data))
            if (!object) {
                return this
            }
            let index = this.indexOf(object)
            for (let field in data) {
                if (data.hasOwnProperty(field)) {
                    this[index][field] = data[field]
                }
            }
            return this
        }
        for (let i = 0; i < this.length; i++) {
            for (let field in data) {
                if (data.hasOwnProperty(field)) {
                    this[i][field] = data[field]
                }
            }
        }
        return this
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
                for(let prop in obj) {
                    if(obj.hasOwnProperty(prop)) {
                        return false;
                    }
                }
                return JSON.stringify(obj) === JSON.stringify({});
            }
            return false
        }
        function getMatch (obj, path, value) {
            for (let i = 0; i < path.length; i++) {
                let key = path[i]
                if (obj && obj.hasOwnProperty(key) || ((key == "id" || key == "pk") && QuerySet.get_pk(obj))) {
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
                        let nested_path = path.slice(i + 1)
                        for (let j = 0; j < obj.length; j++) {
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
                        } else if (key == "startswith") {
                            if (obj != null && obj.constructor === String && value != null && value.constructor === String) {
                                if (obj.trim().startsWith(value.trim())) {
                                    return true
                                }
                            }
                        } else if (key == "istartswith") {
                            if (obj != null && obj.constructor === String && value != null && value.constructor === String) {
                                if (obj.trim().toLowerCase().startsWith(value.trim().toLowerCase())) {
                                    return true
                                }
                            }
                        } else if (key == "endswith") {
                            if (obj != null && obj.constructor === String && value != null && value.constructor === String) {
                                if (obj.trim().endsWith(value.trim())) {
                                    return true
                                }
                            }
                        } else if (key == "iendswith") {
                            if (obj != null && obj.constructor === String && value != null && value.constructor === String) {
                                if (obj.trim().toLowerCase().endsWith(value.trim().toLowerCase())) {
                                    return true
                                }
                            }
                        } else if (key == "contains") {
                            if (obj != null && obj.constructor === String && value != null && value.constructor === String) {
                                if (obj.trim().indexOf(value.trim()) !== -1) {
                                    return true
                                }
                            }
                        } else if (key == "icontains") {
                            if (obj != null && obj.constructor === String && value != null && value.constructor === String) {
                                if (obj.trim().toLowerCase().indexOf(value.trim().toLowerCase()) !== -1) {
                                    return true
                                }
                            }
                        } else if (key == "exact") {
                            if (obj != null && obj.constructor === String && value != null && value.constructor === String) {
                                if (obj.trim() == value.trim()) {
                                    return true
                                }
                            }
                        } else if (key == "iexact") {
                            if (obj != null && obj.constructor === String && value != null && value.constructor === String) {
                                if (obj.trim().toLowerCase() == value.trim().toLowerCase()) {
                                    return true
                                }
                            }
                        } else if (key == "in") {
                            if (value != null && Array.isArray(value)) {
                                for (let k = 0; k < value.length; k++) {
                                    if (obj == value[k]) {
                                        return true
                                    }
                                }
                            }
                        } else if (key == "range") {
                            if (value != null && Array.isArray(value)) {
                                let left = value[0]
                                let right = value[value.length - 1]
                                let x = QuerySet.parseDate(obj, date_formats)
                                let a = QuerySet.parseDate(left, date_formats)
                                let b = QuerySet.parseDate(right, date_formats)
                                if (a && b) {
                                    if (x >= a && x <= b) {
                                        return true
                                    }
                                } else if (obj >= left && obj <= right) {
                                    return true
                                }
                            }
                        // } else if (key == "not_in") {
                        //     if (value != null && Array.isArray(value)) {
                        //         for (let k = 0; k < value.length; k++) {
                        //             if (obj == value[k]) {
                        //                 return false
                        //             }
                        //         }
                        //         return true
                        //     }
                        } else if (key == "lt") {
                            if (value != null) {
                                let a = QuerySet.parseDate(obj, date_formats)
                                let b = QuerySet.parseDate(value, date_formats)
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
                                let a = QuerySet.parseDate(obj, date_formats)
                                let b = QuerySet.parseDate(value, date_formats)
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
                                let a = QuerySet.parseDate(obj, date_formats)
                                let b = QuerySet.parseDate(value, date_formats)
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
                                let a = QuerySet.parseDate(obj, date_formats)
                                let b = QuerySet.parseDate(value, date_formats)
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
        let result = true
        for(let key in query) {
            let path = key.split(separator)
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
            return super.filter(arguments[0]);
        }
        let query = []
        for (let i = 0; i < arguments.length; i++) {
            query.push(arguments[i])
        }
        if (!query.length) {
            return new QuerySet(this)
        }
        if (!Array.isArray(query)) {
            query = [query]
        }
        let separator = this.separator
        let date_formats = this.date_formats
        let filter = this.getFilter
        return this.filter(function(item) {
            for (let i = 0; i < query.length; i++) {
                if (filter(item, query[i], true, separator, date_formats)) {
                    return true
                }
            }
            return false
        });;
    }
    exclude () {
        /*
        * Filter queryset by dictionary of fields and values
        * returns new QuerySet
        */
        let query = []
        for (let i = 0; i < arguments.length; i++) {
            query.push(arguments[i])
        }
        if (!query.length) {
            return new QuerySet(this)
        }
        if (!Array.isArray(query)) {
            query = [query]
        }
        let separator = this.separator
        let date_formats = this.date_formats
        let filter = this.getFilter
        return new QuerySet(this.filter(function(item) {
            for (let i = 0; i < query.length; i++) {
                if (filter(item, query[i], false, separator, date_formats)) {
                    return true
                }
            }
            return false
        }));
    }
    remove (x) {
        /*
        * Remove the first item from the list whose value is equal to x
        */
        let index = this.indexOf(x)
        if (index !== -1) {
            this.splice(index, 1);
        }
    }
    delete (query) {
        /*
        * Get by id or find all by condition and delete from list
        *
        * query could be id or dictionary
        */
        if (!query) {
            return null;
        }
        if (Number.isInteger(query) || query.constructor === String) {
            for (let i = 0; i < this.length; i++) {
                if (QuerySet.get_pk(this[i]) == query.toString()) {
                    this.splice(i, 1);
                    return null;
                }
            }
        } else {
            let to_pop = this.filter(query);
            for (let i = 0; i < to_pop.length; i++) {
                let index = this.indexOf(to_pop[i])
                if (index !== -1) {
                    this.pop(index);
                }
            }
        }
        return null;
    }
    clear () {
        /*
        * Delete all objects in queryset
        */
        while (this.length) {
            this.pop();
        }
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
            return new QuerySet([])
        }
        let separator = this.separator
        let sub_queries = query.split(separator)
        let values = [];

        function getNested (obj, path, values) {
            for (let i = 0; i < path.length; i++) {
                if (obj && obj.hasOwnProperty(path[i]) || ((path[i] == "id" || path[i] == "pk") && QuerySet.get_pk(obj))) {
                    // automatically check both 'id' or 'pk' if either present in parameters
                    if ((path[i] == "id" || path[i] == "pk") && QuerySet.get_pk(obj)) {
                        obj = QuerySet.get_pk(obj)
                    } else {
                        obj = obj[path[i]]
                    }
                    // obj = obj[path[i]]
                    if (Array.isArray(obj)) {
                        if (i == path.length - 1) {
                            for (let j = 0; j < obj.length; j++) {
                                values.push(obj[j])
                            }
                        } else {
                            let nested_path = path.slice(i + 1)
                            for (let j = 0; j < obj.length; j++) {
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

        for (let i = 0; i < this.length; i++) {
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
        let values_list = this
        if (query) {
            values_list = this.values_list(query)
        }
        if (!values_list.length) {
            return 0
        }
        return values_list.reduce((total, current) => parseFloat(total) + parseFloat(current))
    }
    avg (query) {
        /*
        * Get average of field in QuerySet
        */
        if (!this.length) {
            return 0
        }
        return this.sum(query) / this.length;
    }
    min (query) {
        /*
        * Get average of field in QuerySet
        */
        if (!this.length) {
            return null
        }
        let date_formats = this.date_formats
        let values_list = this.values_list(query)
        if (!values_list.length) {
            return null
        }
        return values_list.reduce(function(m, x) {
            let a = QuerySet.parseDate(m, date_formats)
            let b = QuerySet.parseDate(x, date_formats)
            if (a && b) {
                return a < b ? m : x
            }
            return m < x ? m : x
        })
    }
    max (query) {
        /*
        * Get average of field in QuerySet
        */
        if (!this.length) {
            return null
        }
        let date_formats = this.date_formats
        let values_list = this.values_list(query)
        if (!values_list.length) {
            return null
        }
        return values_list.reduce(function(m, x) {
            let a = QuerySet.parseDate(m, date_formats)
            let b = QuerySet.parseDate(x, date_formats)
            if (a && b) {
                return a > b ? m : x
            }
            return m > x ? m : x
        })
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
        let fields = []
        for (let i = 0; i < arguments.length; i++) {
            fields.push(arguments[i])
        }
        let separator = this.separator
        let date_formats = this.date_formats

        function getNested (obj, path) {
            for (let i = 0; i < path.length; i++) {
                if (obj && obj.hasOwnProperty(path[i]) || ((path[i] == "id" || path[i] == "pk") && QuerySet.get_pk(obj))) {
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
        for (let i = 0; i < fields.length; i++) {
            let field = fields[i];
            let desc = field[0] == "-"
            this.sort(function(a, b) {
                if (desc) {
                    let path = field.substr(1).split(separator)
                    let x = getNested(b, path)
                    let y = getNested(a, path)
                    if (typeof x === "boolean" && typeof y === "boolean") {
                        return (x === y) ? 0 : x ? -1 : 1;
                    }
                    let date_x = QuerySet.parseDate(x, date_formats)
                    let date_y = QuerySet.parseDate(y, date_formats)
                    if (date_x && date_y) {
                        return (date_x === date_y) ? 0 : date_x > date_y ? 1 : -1
                    }
                    return (x === y) ? 0 : x > y ? 1 : -1
                }
                let path = field.split(separator)
                let x = getNested(b, path)
                let y = getNested(a, path)
                if (typeof x === "boolean" && typeof y === "boolean") {
                    return (x === y) ? 0 : y ? -1 : 1;
                }
                let date_x = QuerySet.parseDate(x, date_formats)
                let date_y = QuerySet.parseDate(y, date_formats)
                if (date_x && date_y) {
                    return (date_x === date_y) ? 0 : date_x < date_y ? 1 : -1
                }
                return (x === y) ? 0 : x < y ? 1 : -1
            });
        }
        return this
    }
    distinct () {
        let fields = []
        for (let i = 0; i < arguments.length; i++) {
            fields.push(arguments[i])
        }
        if (!fields.length) {
            let set = new Set(this)
            return new QuerySet(Array.from(set))
        }

        let separator = this.separator
        function getNested (obj, path) {
            for (let i = 0; i < path.length; i++) {
                if (obj && obj.hasOwnProperty(path[i]) || ((path[i] == "id" || path[i] == "pk") && QuerySet.get_pk(obj))) {
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

        let results = new QuerySet();
        for (const item of this) {
            let is_distinct = true
            for (let i = 0; i < fields.length; i++) {
                let args = {}
                let path = fields[i].split(separator)
                args[fields[i]] = getNested(item, path)
                if (results.filter(args).exists()) {
                    is_distinct = false
                }
            }
            if (is_distinct) {
                results.append(item);
            }
        }
        let set = new Set(results)
        return new QuerySet(Array.from(set))
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
    prepend (data) {
        /*
        * Add object to queryset
        */
        this.unshift(data);
    }
    extend (objects) {
        /*
        * Add multiple objects to queryset
        */
        for (let i = 0; i < objects.length; i++) {
            this.push(objects[i]);
        }
    }
    pop (index) {
        /*
        * Remove the item at the given position in the list, and return it.
        * If no index is specified, .pop() removes and returns the last item
        */
        if (index != undefined) {
            if (this.length > index && this[index]) {
                return this.splice(index, 1)[0]
            }
            return undefined
        }
        if (this.length) {
            return this.splice(this.length - 1, 1)[0]
        }
        return undefined
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
        return this.length != 0
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
        if (!date) {
            return date
        }
        if (date.constructor == Date) {
            return date
        }
        if (date.constructor == String) {
            for (let i = 0; i < date_formats.length; i++) {
                let d = moment(date, date_formats[i])
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
        * return string or null
        */
        if (object) {
            return object.id ? object.id.toString() : object.pk ? object.pk.toString() : null;
        }
        return null;
    }
    toArray () {
        return Array.from(this)
    }
}
