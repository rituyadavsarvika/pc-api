// An utility class to formate some response (get specific fields, dynamic sort, pagination, search) with dynamic query
class APIFeature {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    // add dynamic query to find option
    filter() {
        const queryObj = { ...this.queryString };
        // exclude reserved key for this class. cause this keys have specific functionality
        const excludeFields = [
            'page',
            'limit',
            'sort',
            'fields',
            'search',
            'searchBy',
            'multiple',
        ];
        excludeFields.forEach(el => delete queryObj[el]);

        // generate query in mongodb formate
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(
            /\b(gte|gt|lte|lt)\b/g,
            match => `$${match}`
        );

        queryStr = JSON.parse(queryStr);

        // search feature. if query parameter contain search keyword then trigger this portion to set text search in mongo query
        if (this.queryString.search) {
            let searchBy = this.queryString.search;
            queryStr['$text'] = {
                $search: searchBy
            };
        }

        this.query = this.query.find(queryStr);
        return this;
    }

    // This portion responsible to return total result count. this portion also include all filter and search criteria.
    // That means this portion return result count after filtering and / or search
    countFilter() {
        const queryObj = { ...this.queryString };
        const excludeFields = [
            'page',
            'limit',
            'sort',
            'fields',
            'search',
            'searchBy',
            'multiple',
        ];
        excludeFields.forEach(el => delete queryObj[el]);

        // 1B) Advance filtering
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(
            /\b(gte|gt|lte|lt)\b/g,
            match => `$${match}`
        );

        queryStr = JSON.parse(queryStr);

        // search feature
        if (this.queryString.search) {
            let searchBy = this.queryString.search;
            queryStr['$text'] = {
                $search: searchBy
            };
        }

        this.query = this.query.countDocuments(queryStr);
        return this;
    }

    // formate sort=name,-email
    // this portion is responsible to sort data after filter and or search. This search is dynamic.you can control your sort criteria.
    // Here if you want to sort in ascending order then just put field name separated by comma (for multiple sort criteria)
    // for descending order just put extra - sign before field name (exm. -name). and also separated by comma for multiple fields
    // if no sort criteria provided then by default sort by mongodb unique id (_id) in ascending order
    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query
                .sort(sortBy)
                .collation({ locale: 'en_US', numericOrdering: true });
        } else {
            this.query = this.query
                .sort('-_id')
                .collation({ locale: 'en_US', numericOrdering: true });
        }
        return this;
    }

    // formate fields=name,-_id
    // this portion is responsible for limiting the fields option in API response. just put your fields separated by comma (exm. fields=name,email)
    // to excludes fields just put - before fields name. emp fields=-_id
    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }
        return this;
    }

    // you can create pagination to you expected result. you have to pass page number and no of fields in a single page
    // by default it set page no 1 and 50 number of data in a single page.
    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 1000;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}

module.exports = APIFeature;
