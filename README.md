## Overview

```queryset.js``` is a data structure with [Django QuerySet](https://docs.djangoproject.com/en/2.2/ref/models/querysets/)-like syntax

it is designed primarily to manipulate [Django Rest Framework](https://www.django-rest-framework.org/) [ViewSet](https://www.django-rest-framework.org/api-guide/viewsets/) response

Supported lookups:
```javascript
not, isnull, in, range, lt, lte, gt, gte,
startswith, istartswith, endswith, iendswith, contains, icontains, exact, iexact
```


## Expamples
```javascript
var qs = new QuerySet(list)

qs.filter({profile__active: true}).values_list("name").distinct()
// aggregate nested arrays
qs.sum("invoices__items__amount")
// filter by nested arrays
qs.filter({invoices__items__amount__range: [100, 500]})
qs.filter({author__not: "John Doe"})
// nested array not empty
qs.filter({posts__not: null})
// nested array empty
qs.filter({posts: null})

qs.distinct("profile__id")
  .values_list("posts")
  .filter({
    likes_count__gt: 100,
    date__gte: "17/11/2019"
  })
  .order_by("-likes_count")

// OR query
qs.filter(
    {likes_count__gt: 20},
    {author__contains: "Jane"}
)

qs.filter({author__contains: "Jane"})  // case-sensitive
qs.filter({author__icontains: "jane"})  // case-insensitive
qs.exclude({author__exact: "Jane Smith"})  // case-sensitive

// 'pk' and 'id' work the same way
qs.filter({pk__in: [1, 2]})
qs.filter({id__in: [1, 2]})

// QuerySet is inheriting Array
// but does not break Array functionality
// .filter() can be used same as Array.filter
qs.filter(function(item){ return item.name == "Admin" })

// and all other Array features too
for (var item of qs) {
  item
}
for (var i = 0; i < qs.length; i++) {
  qs[i]
}
qs.map(item => item.name).join(', ')
qs.reduce(function(previousValue, currentValue, index, array){
  return previousValue + currentValue;
})
qs.forEach(function(item){ /***/ })
// and so on

// if you need it to actually be Array
qs.toArray()
```


<b>Date comparisons only work with [moment.js](https://momentjs.com/)</b>
```javascript
.order_by("date")
.filter({date__gte: "13/01/2019"})
```


#### [More examples](https://github.com/Worldrider/queryset/blob/master/tests.js)


## Documentation

### Methods
<table>
    <thead>
        <tr>
            <th>Method</th>
            <th>Description</th>
            <th>Example</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>filter</td>
            <td>Filter queryset by dictionary of fields and values.
</br>
You can pass multiple dictionaries to do OR lookup
</br>
if pass function as a parameter it works as Array.filter</td>
            <td>
                <pre lang="javascript"><code>.filter({invoices__amount__gt: 100})
// OR
.filter(
  {name__icontains: "Jane"},
  {likes_count__gt: 42}
)</br></br>
// can be used same as Array.filter
.filter(function(item) {
  return item.name == "Admin"
})</code></pre>
            </td>
        </tr>
        <tr>
            <td>exclude</td>
            <td>Filter queryset by dictionary of fields and values</td>
            <td>
                <pre lang="javascript"><code>.exclude({invoices__date__lte: "17/11/2019"})</code></pre>
            </td>
        </tr>
        <tr>
            <td>get</td>
            <td>
                Get by id or find by condition </br>
            </td>
            <td>
                <pre lang="javascript"><code>.get({id: 42})
.get({pk: "42"})
// 'pk' and 'id'
// work in same way in all lookups
// and can be string or int
.get(42)
.get("42")
</br>
.get({name: "Jane"})
</br>
.get({profile__active: true})
// equivalent to
.filter({profile__active: true}).first()</code></pre>
            </td>
        </tr>
        <tr>
            <td>values_list</td>
            <td>Return flat list of values of specific field</td>
            <td>
                <pre lang="javascript"><code>qs = qs.filter({profile__active: true})
qs.values_list("name")
</br>
qs.values_list("invoices").sum("amount")</code></pre>
            </td>
        </tr>
        <tr>
            <td>order_by</td>
            <td>
                Order queryset by field or list of fields </br>
                <b><i>Does not order by nested lists, only by object properties</b></i>
            </td>
            <td>
                <pre lang="javascript"><code>.order_by("profile__active")
.order_by("id", "amount")</code></pre>
            </td>
        </tr>
        <tr>
            <td>distinct</td>
            <td>
                Return unique items of queryset</br>
                Can be applied accross multiple fields</br>
                <b><i>Does not support nested lists, only by object properties</b></i>
            </td>
            <td>
                <pre lang="javascript"><code>.distinct("name")
.distinct("id", "amount")</code></pre>
            </td>
        </tr>
        <tr>
            <td>append</td>
            <td>Add an object to end of queryset</td>
            <td>
                <pre lang="javascript"><code>.append({id: 1, name: "Jane"})</code></pre>
            </td>
        </tr>
        <tr>
            <td>prepend</td>
            <td>Add an object to beginning of queryset</td>
            <td>
                <pre lang="javascript"><code>.prepend({id: 1, name: "Jane"})</code></pre>
            </td>
        </tr>
        <tr>
            <td>extend</td>
            <td>Add multiple objects to queryset</td>
            <td>
                <pre lang="javascript"><code>.extend([
  {id: 1, name: "Jane"},
  {id: 2, name: "John"},
])</code></pre>
            </td>
        </tr>
        <tr>
            <td>pop</td>
            <td>
                Remove the item at the given position in the list, and return it.<br>
                If no index is specified, remove and return last item.<br>
                Return undefined if queryset is empty
            </td>
            <td>
                <pre lang="javascript"><code>.pop(42)
.pop()</code></pre>
            </td>
        </tr>
        <tr>
            <td>remove</td>
            <td>Remove the first item from the list whose value is equal to x</td>
            <td>
                <pre lang="javascript"><code>.remove(x)</code></pre>
            </td>
        </tr>
        <tr>
            <td>delete</td>
            <td>Remove items that match query</td>
            <td>
                <pre lang="javascript"><code>.delete({name: "Jane"})</code></pre>
            </td>
        </tr>
        <tr>
            <td>clear</td>
            <td>Remove all items</td>
            <td>
                <pre lang="javascript"><code>.clear()</code></pre>
            </td>
        </tr>
        <tr>
            <td>update</td>
            <td>Update set of fields on all objects in queryset
</br>
Or update a single element if 'id' or 'pk' is provided</td>
            <td>
                <pre lang="javascript"><code>.update({amount: 1000})
</br>
// NOTE: nested fields are not supported yet
.update({invoices__amount: 1000})
</br>
// this will create 'invoices__amount'
// property on every object in queryset
</br>
// this will update single element
.update({id: 42, name: "John Doe"})
</code></pre>
            </td>
        </tr>
        <tr>
            <td>sum</td>
            <td>Get sum of field in queryset</td>
            <td>
                <pre lang="javascript"><code>.sum("invoices__amount")</code></pre>
            </td>
        </tr>
        <tr>
            <td>avg</td>
            <td>Get average of field in queryset</td>
            <td>
                <pre lang="javascript"><code>.avg("profile__likes_count")</code></pre>
            </td>
        </tr>
        <tr>
            <td>min</td>
            <td>Get min value of field in queryset</br>
Works with dates too</td>
            <td>
                <pre lang="javascript"><code>.min("date")</code></pre>
            </td>
        </tr>
        <tr>
            <td>max</td>
            <td>Get max value of field in queryset</br>
Works with dates too</td>
            <td>
                <pre lang="javascript"><code>.max("amount")</code></pre>
            </td>
        </tr>
        <tr>
            <td>first</td>
            <td>Return first object in queryset or null</td>
            <td>
                <pre lang="javascript"><code>.first()</code></pre>
            </td>
        </tr>
        <tr>
            <td>last</td>
            <td>Return last object in queryset or null</td>
            <td>
                <pre lang="javascript"><code>.last()</code></pre>
            </td>
        </tr>
        <tr>
            <td>exists</td>
            <td>Return true if queryset has at least 1 object</td>
            <td>
                <pre lang="javascript"><code>.filter({profile__active: true}).exists()</code></pre>
            </td>
        </tr>
        <tr>
            <td>count</td>
            <td>Retrun number of items in queryset</td>
            <td>
                <pre lang="javascript"><code>.filter({profile__active: true}).count()</code></pre>
            </td>
        </tr>
        <tr>
            <td>toArray</td>
            <td>Get Array from queryset</td>
            <td>
                <pre lang="javascript"><code>.toArray()</code></pre>
            </td>
        </tr>
    <tbody>
</table>

### Settings
<table>
    <thead>
        <tr>
            <th>Setting</th>
            <th>Description</th>
            <th>Example</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>separator</td>
            <td>Symbol used to split nested fields and lookups</td>
            <td>
                <pre lang="javascript"><code>QuerySet.setConfig({separator: "."})
</br>
qs.filter({"invoices.total.gte": 100})
qs.sum("invoices.items.amount")</code></pre>
            </td>
        </tr>
        <tr>
            <td>date_formats</td>
            <td>Formats that will be tried to parse date </br>
NOTE: it will only work if you use <b><a href="https://momentjs.com/">moment.js</a></b></td>
            <td>
                <pre lang="javascript"><code>QuerySet.setConfig({date_formats: [
  "YYYY-MM-DD", "YYYY.MM.DD",
]})
</br>
qs.filter({date: "2019-11-17"})</code></pre>
Defaults are:
                <pre lang="javascript"><code>[
  "DD/MM/YYYY",
  "DD-MM-YYYY",
  "DD.MM.YYYY",
  "DD/MM/YYYY HH:mm",
  "DD-MM-YYYY HH:mm",
  "DD.MM.YYYY HH:mm",
  "YYYY-MM-DDThh:mm:ss"
  "YYYY/MM/DD",
  "YYYY-MM-DD",
  "YYYY.MM.DD",
  "YYYY/MM/DD HH:mm",
  "YYYY-MM-DD HH:mm",
  "YYYY.MM.DD HH:mm",
]</code></pre>
            </td>
        </tr>
    <tbody>
</table>


### TODO
- queries:
   - date queries:
      - year
      - month
      - day
      - week
      - week_day
      - quarter
      - hour
      - minute
      - second
   - regex
   - iregex
- chaining date queries: ```start_date___year__gte=2019```
- detect properties which include separator: ```property__including__separator```
- values_list ```flat``` option (right now it is always flat)
- support multiple separators ?
- handle dates independently from [moment.js](https://momentjs.com/) ?


## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2020, Eugene Ivanov
