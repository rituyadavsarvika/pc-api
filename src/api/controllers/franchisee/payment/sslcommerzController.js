const axios = require('axios');
const DATAFORMATER = require('../../../../utils/dataFormate');

/**
 * @param  {request} req
 * @param  {response} res
 * @description SSL commerz Payment initiate
 */
const sslcommerzInitiate = async (req, res) => {
    const transactionId = (
        await DATAFORMATER.generateUniqueNumber(10, true, true)
    ).toUpperCase();

    const config = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    const params = new URLSearchParams();
    params.append('store_id', 'proli60c084734deb0');
    params.append('store_passwd', 'proli60c084734deb0@ssl');
    params.append('total_amount', 100);
    params.append('currency', 'BDT');
    params.append('tran_id', transactionId);
    params.append('emi_option', 0);
    params.append(
        'success_url',
        `http://localhost:80/api/v1/sslcommerzInitiate/success?transactionId=${transactionId}`
    );
    params.append(
        'cancel_url',
        'http://localhost:80/api/v1/sslcommerzInitiate/cancel'
    );
    params.append(
        'fail_url',
        'http://localhost:80/api/v1/sslcommerzInitiate/fail'
    );
    params.append(
        'ipn_url',
        `http://localhost:80/api/v1/sslcommerzInitiate/ipn`
    );

    params.append('cus_name', 'Shariful Islam');
    params.append('cus_email', 'shariful.prolific@gmail.com');
    params.append('cus_add1', 'Dhaka');
    params.append('cus_city', 'Dhaka');
    params.append('cus_state', 'Dhaka');
    params.append('cus_postcode', 1212);
    params.append('cus_country', 'Bangladesh');
    params.append('cus_phone', '01742023458');
    params.append('cus_fax', '01742023458');

    params.append('ship_name', 'My ship');
    params.append('ship_add1', 'Dhaka');
    params.append('ship_city', 'Dhaka');
    params.append('ship_state', 'Dhaka');
    params.append('ship_postcode', '1212');
    params.append('ship_country', 'Bangladesh');
    params.append('shipping_method', 'Courier');
    params.append('product_name', 'panjabi,watch,laptop');
    params.append('product_category', 'lifestyle,electronics');
    params.append('product_profile', 'general');

    axios
        .post(
            'https://sandbox.sslcommerz.com/gwprocess/v4/api.php',
            params,
            config
        )
        .then(initiateData => {
            // res.status(200).redirect(301, initiateData?.data?.GatewayPageURL);
            res.status(200).json({
                status: 'success',
                data: initiateData?.data
            });
        })
        .catch(err => {
            res.status(500).json({ status: 'failed', err });
        });
};

/**
 * ---------------------- OLD CODE -------------------------------------
 */

// const sslcommerzInitiateTest = (req, res) => {
// 	const data = {
// 		total_amount: 100,
// 		currency: 'EUR',
// 		tran_id: 'REF123',
// 		success_url: 'http://192.168.1.233:3530/api/v1/sslcommerzInitiate/ipn',
// 		fail_url: 'http://prolificcloud.com',
// 		cancel_url: 'http://prolificcloud.com',
// 		ipn_url: 'http://192.168.1.233:3530/api/v1/sslcommerzInitiate/ipn',
// 		shipping_method: 'Courier',
// 		product_name: 'Computer.',
// 		product_category: 'Electronic',
// 		product_profile: 'general',
// 		cus_name: 'Customer Name',
// 		cus_email: 'rocky.cse09@gmail.com',
// 		cus_add1: 'Dhaka',
// 		cus_add2: 'Dhaka',
// 		cus_city: 'Dhaka',
// 		cus_state: 'Dhaka',
// 		cus_postcode: '1000',
// 		cus_country: 'Bangladesh',
// 		cus_phone: '+8801742023458',
// 		cus_fax: '01711111111',
// 		ship_name: 'Customer Name',
// 		ship_add1: 'Dhaka',
// 		ship_add2: 'Dhaka',
// 		ship_city: 'Dhaka',
// 		ship_state: 'Dhaka',
// 		ship_postcode: 1000,
// 		ship_country: 'Bangladesh',
// 		multi_card_name: 'mastercard'
// 	};
// 	const sslcommer = new SSLCommerzPayment(
// 		'proli60c084734deb0',
// 		'proli60c084734deb0@ssl',
// 		false
// 	); //true for live default false for sandbox
// 	sslcommer.init(data).then(initiateData => {
// 		res.status(200).json({
// 			status: 'success',
// 			data: initiateData
// 		});
// 		// res.redirect(initiateData?.GatewayPageURL);
// 	});
// };

/**
 * ---------------------- END OF OLD CODE -------------------------------------
 */

/**
 * @param  {request} req
 * @param  {response} res
 * @description SSL commerz Payment IPN handler
 */
const ipn = async (req, res) => {
    console.log('IPN data', req.query);

    if (req.body.status == 'VALID') {
        const url =
            'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php';

        const data = await axios(url, {
            parmas: {
                val_id: req.body.val_id,
                store_id: 'proli60c084734deb0',
                store_passwd: 'proli60c084734deb0@ssl'
            }
        });
        if (data.status === 200) {
            // EVERYTHING WAS RIGHT DO WORK WITH YOUR SYSTEM NOW
            console.log(req.body.amount + ' tk recharged successfully');
            res.status(200).json({
                status: 'success',
                message: req.body.amount + ' tk recharged successfully'
            });
        } else
            res.status(200).json({
                status: 'success',
                message: 'Recharge failed'
            });
    } else
        res.status(200).json({
            status: 'success',
            message: 'account recharge ' + req.body.status
        });
};

/**
 * @param  {request} req
 * @param  {response} res
 * @description SSL commerz Payment success handler
 */
const paymentSuccess = (req, res) => {
    const { transactionId } = req.query;
    if (!transactionId) {
        return res.json({ message: 'transactionId must be required' });
    } else {
        // Todo
        // Updata order info and transaction info
        res.redirect(
            `http://california.localhost:3000/checkout/success/${transactionId}`
        );
    }
};

/**
 * @param  {request} req
 * @param  {response} res
 * @description SSL commerz Payment cancel handler
 */
const paymentCancel = (req, res) => {
    // Redirect to client's cancel page
    res.redirect(`http://california.localhost:3000/checkout/cancel`);
};

/**
 * @param  {request} req
 * @param  {response} res
 * @description SSL commerz Payment fail handler
 */
const paymentFail = (req, res) => {
    // Redirect to client's cancel page
    res.redirect(`http://california.localhost:3000/checkout/fail`);
};

//Payment redirections
const APIStatus = (req, res) => {
    if (req.params.status == 'success')
        return res.redirect('http://localhost:3000');
    if (req.params.status == 'failed' || req.params.status == 'cancel')
        return res.redirect('http://localhost:3000');
};

module.exports = {
    sslcommerzInitiate,
    // sslcommerzInitiateTest,
    APIStatus,
    ipn,
    paymentSuccess,
    paymentCancel,
    paymentFail
};
