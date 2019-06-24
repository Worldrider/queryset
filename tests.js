var list = [
    {
        id: 1,
        name: "John Doe",
        group: "users",
        profile: {
            locale: "en",
            created_at: "13/11/2019",
            active: true,
            kudos: 42,
        },
        invoices: [
            {
                id: 1,
                amount: 100,
                date: "13/12/2019",
                items: [
                    {
                        id: 1,
                        amount: 50,
                    }, {
                        id: 2,
                        amount: 50,
                    },
                ]
            }, {
                id: 2,
                amount: 100,
                date: "17/11/2019",
                items: [
                    {
                        id: 3,
                        amount: 50,
                    }, {
                        id: 4,
                        amount: 50,
                    },
                ]
            },
        ],
    }, {
        pk: 2,
        name: "Jane Smith",
        group: "users",
        profile: {
            locale: "en",
            created_at: "13/09/2019",
            active: false,
            kudos: 100,
        },
        invoices: [
            {
                id: 3,
                amount: 500,
                date: "15/03/2019",
                items: [
                    {
                        id: 5,
                        amount: 100,
                    }, {
                        pk: 6,
                        amount: 400,
                    },
                ]
            }, {
                pk: 4,
                amount: 1000,
                date: "18/05/2019",
                items: [
                    {
                        id: 7,
                        amount: 100,
                    }, {
                        id: 8,
                        amount: 900,
                    },
                ]
            },
        ],
    }, {
        name: "Admin",
        group: "users",
        profile: {
            locale: "en",
            created_at: "13/01/2019",
            active: true,
            kudos: 1000,
        },
        pk: 3,
    },
]

var qs = new QuerySet(list)

function assertEqual(a, b) {
    if (JSON.stringify(a) != JSON.stringify(b)) {
        // console.error(`${a} is not equal ${b}`)
        throw new Error(`${a} is not equal ${b}`)
    }
}
function assertIsNotNull(x) {
    if (x == null) {
        // console.error(`unexpectedly null`)
        throw new Error(`unexpectedly null`)
    }
}

assertEqual(qs.values_list("id"), [1, 2, 3])
assertEqual(qs.values_list("pk"), [1, 2, 3])
assertEqual(qs.values_list("name"), ["John Doe", "Jane Smith", "Admin"])
assertEqual(qs.values_list("invoices__id"), [1, 2, 3, 4])
assertEqual(qs.values_list("invoices__pk"), [1, 2, 3, 4])
assertEqual(qs.values_list("invoices__items__id"), [1, 2, 3, 4, 5, 6, 7, 8])
assertEqual(qs.values_list("invoices__items__pk"), [1, 2, 3, 4, 5, 6, 7, 8])
assertEqual(qs.filter({profile__active: true}).count(), 2)
assertEqual(qs.sum("invoices__amount"), 1700)
assertEqual(qs.sum("invoices__items__amount"), 1700)
assertEqual(qs.min("invoices__items__amount"), 50)
assertEqual(qs.max("invoices__items__amount"), 900)
assertEqual(qs.filter({id: 1}).first().name, "John Doe")
assertEqual(qs.filter({id: 1}).count(), 1)
assertEqual(qs.filter({invoices__items__amount: 50}).first().name, "John Doe")
assertEqual(qs.filter({name__not: "Admin"}).first().name, "John Doe")
assertEqual(qs.filter({name__not: "Admin"}).count(), 2)
assertEqual(qs.filter({name__not: "Admin"}).first().name, "John Doe")
assertEqual(qs.filter({name__icontains: "adm"}).first().name, "Admin")
assertEqual(qs.filter({name__exact: "Admin"}).first().name, "Admin")
assertEqual(qs.filter({name__iexact: "admin"}).first().name, "Admin")
assertEqual(qs.filter({invoices__not: null}).count(), 2)
assertEqual(qs.filter({invoices: null}).count(), 1)
assertEqual(qs.filter({invoices: null}).first().name, "Admin")
assertEqual(qs.filter({invoices__amount: null}).first().name, "Admin")
assertEqual(qs.filter({name__startswith: "Adm"}).first().name, "Admin")
assertEqual(qs.filter({name__istartswith: "adm"}).first().name, "Admin")
assertEqual(qs.filter({name__endswith: "Doe"}).first().name, "John Doe")
assertEqual(qs.filter({name__iendswith: "doe"}).first().name, "John Doe")
assertEqual(qs.filter({invoices__isnull: false}).count(), 2)
assertEqual(qs.filter({invoices__isnull: true}).count(), 1)
assertEqual(qs.filter({invoices__isnull: true}).first().name, "Admin")
assertEqual(qs.filter({invoices__amount__isnull: true}).count(), 1)
assertEqual(qs.filter({invoices__amount__isnull: true}).first().name, "Admin")
assertEqual(qs.filter({invoices__amount__gt: 100}).count(), 1)
assertEqual(qs.filter({invoices__amount__gt: 100}).first().name, "Jane Smith")
assertEqual(qs.filter({invoices__amount__lt: 500}).count(), 1)
assertEqual(qs.filter({invoices__amount__lt: 500}).first().name, "John Doe")
assertEqual(qs.filter({invoices__amount__gte: 500}).count(), 1)
assertEqual(qs.filter({invoices__amount__gte: 500}).first().name, "Jane Smith")
assertEqual(qs.filter({invoices__date__gte: "17/11/2019"}).count(), 1)
assertEqual(qs.filter({invoices__date__gte: "17/11/2019"}).first().name, "John Doe")
assertEqual(qs.filter({name__icontains: "jane"}).count(), 1)
assertEqual(qs.filter({name__contains: "Jane"}).count(), 1)
assertEqual(qs.filter({name__icontains: "jane"}).first().name, "Jane Smith")
assertEqual(qs.filter({name__contains: "Jane"}).first().name, "Jane Smith")
assertEqual(qs.exclude({name__icontains: "Jane"}).count(), 2)
assertEqual(qs.exclude({name__icontains: "Jane"}).first().name, "John Doe")
assertEqual(qs.filter({name__in: ["Jane Smith", "Admin"]}).count(), 2)
assertEqual(qs.filter({name__in: ["Jane Smith", "Admin"]}).first().name, "Jane Smith")
assertEqual(qs.filter({pk__in: [1, 2]}).count(), 2)
assertEqual(qs.filter({pk__in: [1, 2]}).first().name, "John Doe")
assertEqual(qs.exclude({name__in: ["Jane Smith", "Admin"]}).count(), 1)
assertEqual(qs.exclude({name__in: ["Jane Smith", "Admin"]}).first().name, "John Doe")
assertEqual(qs.exclude({id: 1}).first().name, "Jane Smith")
assertEqual(qs.exclude({id: 1}).count(), 2)
assertEqual(qs.filter({pk: 1}).first().name, "John Doe")
assertEqual(qs.filter({pk: 1}).count(), 1)
assertEqual(qs.exclude({pk: 1}).first().name, "Jane Smith")
assertEqual(qs.exclude({pk: 1}).count(), 2)
assertEqual(qs.filter({profile__kudos: 42}).first().name, "John Doe")
assertEqual(qs.filter({profile__kudos: 42}).count(), 1)
assertEqual(qs.exclude({profile__kudos: 42}).first().name, "Jane Smith")
assertEqual(qs.exclude({profile__kudos: 42}).count(), 2)
assertEqual(qs.filter({id: 1}, {name: "Admin"}).count(), 2)
assertEqual(qs.filter({id: 1}, {name: "Admin"}).first().name, "John Doe")
assertEqual(qs.filter({id: 1}, {name: "Admin"}).last().name, "Admin")
assertEqual(qs.order_by("id").first().name, "John Doe")
assertEqual(qs.order_by("pk").first().name, "John Doe")
assertEqual(qs.order_by("-pk").first().name, "Admin")
assertEqual(qs.order_by("-profile__active").first().name, "Jane Smith")
assertEqual(qs.order_by("name").first().name, "Admin")
assertEqual(qs.order_by("profile__active").last().name, "Jane Smith")
assertEqual(qs.order_by("-profile__created_at").last().name, "Admin")
assertEqual(qs.order_by("profile__created_at").last().name, "John Doe")
assertEqual(qs.filter({profile__active: true}).values_list("invoices").sum("amount"), 200)
assertEqual(qs.filter({profile__active: false}).values_list("invoices").sum("amount"), 1500)
assertEqual(qs.filter({invoices__id__in: [1, 2]}).count(), 1)
assertEqual(qs.filter({invoices__id__in: [1, 2, 3]}).count(), 2)
assertEqual(qs.filter({invoices__id__in: [1, 2, 3], profile__active: true}).count(), 1)
assertEqual(qs.filter({invoices__id__in: [1, 2, 3], profile__active: true}, {name__icontains: "ad"}).count(), 2)
assertEqual(qs.filter({invoices__items__amount__range: [100, 1000]}).count(), 1)
assertEqual(qs.values_list("invoices").filter({date__range: ["18/05/2019", "13/12/2019"]}).count(), 3)
assertEqual(qs.values_list("invoices").min("date"), "15/03/2019")
assertEqual(qs.values_list("invoices").max("date"), "13/12/2019")
assertEqual(qs, qs.toArray())
assertEqual(qs.filter({invoices__id__in: [1, 2, 3], profile__active: true}).exclude({name__icontains: "Adm"}).count(), 1)

qs.setConfig({separator: "."})

assertEqual(qs.filter({"profile.active": true}).count(), 2)
assertEqual(qs.filter({"profile.active": true}).filter({"invoices.pk.in": [1, 2]}).count(), 1)
assertEqual(qs.filter({"profile.active": true}).filter({"invoices.pk.in": [1, 2]}).values_list("name"), ["John Doe"])
assertEqual(qs.filter({"profile.active": true}).filter({"invoices.pk.in": [1, 2]}).values_list("name").separator, ".")
qs.setConfig({separator: "__"})

qs.add(list[2])
assertEqual(qs.count(), 4)

qs.append(list[2])
assertEqual(qs.count(), 5)

qs.extend(list)
assertEqual(qs.count(), 8)
assertEqual(qs.exists(), true)
assertEqual(qs.distinct().count(), 3)
assertEqual(qs.values_list("invoices__items__pk").distinct().count(), 8)
assertEqual(qs.distinct("name").count(), 3)
assertEqual(qs.distinct("profile__created_at").count(), 3)
assertEqual(qs.distinct("profile__active").count(), 2)
assertEqual(qs.distinct("name", "id").count(), 3)
assertEqual(qs.distinct("name", "pk").count(), 3)
assertEqual(qs.distinct("profile__locale").count(), 1)
assertEqual(qs.distinct("profile__locale", "pk").count(), 1)
assertEqual(qs.distinct("group").count(), 1)
assertEqual(qs.distinct("profile__locale", "group").count(), 1)

qs.delete()
assertEqual(qs.count(), 0)
assertEqual(qs.values_list("invoices").min("date"), null)
assertEqual(qs.values_list("invoices").max("date"), null)
assertEqual(qs.values_list("invoices").sum("amount"), 0)
assertEqual(qs.values_list("invoices").avg("amount"), 0)

qs = new QuerySet(list)
