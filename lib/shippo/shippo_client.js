"use strict";

const config = require("../../server_config.js");
const CustomError = require("../util/custom_error");
const common = require("../util/common");

const FLEXE_API_TOKEN = config.getConfig("FLEXE_SHIPPO_API_TOKEN");
const SHIPPO_CLIENTS = {
    FLEXE_API_TOKEN: require("shippo")(FLEXE_API_TOKEN),
};

function getShippo(apiToken) {
    let shippo = SHIPPO_CLIENTS[apiToken];
    if (!shippo) {
        shippo = require("shippo")(apiToken);
        shippo.setTimeout(config.getConfig("SHIPPO_TIMEOUT"));
        SHIPPO_CLIENTS[apiToken] = shippo;
    }
    return shippo;
}

function handleShippoError(err) {
    if (err.type === "ShippoAuthenticationError") {
        return new CustomError("400106");
    } else if (err.type === "ShippoConnectionError" && common.getIn(err, "detail.code") === "ETIMEDOUT") {
        return new CustomError("500102");
    } else {
        return new CustomError("500101", err.message);
    }
}

module.exports = {
    validateAddress: function (addressData, apiToken, callback) {
        const shippo = getShippo(apiToken || FLEXE_API_TOKEN);
        const addressDataForRequest = {
            name: addressData.name || "",
            company: addressData.company || "",
            street1: addressData.street1 || "",
            street2: addressData.street2 || "",
            city: addressData.city || "",
            state: addressData.state || "",
            zip: addressData.zip || "",
            country: addressData.country || "US",
            phone: addressData.phone || "",
            email: addressData.email || "",
            is_residential: addressData.is_residential || "",
            validate: true,
        };

        shippo.address.create(addressDataForRequest)
            .then(data => {
                callback(null, {
                    address: {
                        name: data.name,
                        company: data.company,
                        street1: data.street1,
                        street2: data.street2,
                        city: data.city,
                        state: data.state,
                        zip: data.zip,
                        country: data.country,
                        phone: data.phone,
                        email: data.email,
                        is_residential: data.is_residential,
                    },
                    isValid: data.validation_results.is_valid,
                    messages: data.validation_results.messages,
                });
            })
            .catch(err => {
                let customError = handleShippoError(err);
                callback(customError);
            });
    },

    /**
     *
     * @param rateRequestData
     *         rate_request_data =
     {
                carrier_account_ids: carrier_account_ids,
                from_address: Fulfillment::Manager.get_ship_from_address(res_cfg.reservation),
                to_address: Fulfillment::Manager.get_ship_to_address(order_data),
                return_address: Fulfillment::Manager.get_ship_return_address(res_cfg.reservation),
                dimensions: Fulfillment::Manager.get_shipment_weight_dimensions(
                    customer_order_uuid,
                    order_data[:items],
                    res_cfg.reservation_id,
                    inventory_properties),
                signature_confirmation: shipping_label_data[:signature_confirmation],
                service_type: shipping_label_data[:service_type],
                shipping_reference_1: shipping_label_data[:shipping_reference_1],
                shipping_reference_2: shipping_label_data[:shipping_reference_2],
                force_given_address: true
            }
     */
    getShippingRate: function (rateRequestData, apiToken, callback) {
        const shippo = getShippo(apiToken || FLEXE_API_TOKEN);
        const addressFrom = {
            name: "Shawn Ippotle",
            street1: "215 Clayton St.",
            city: "San Francisco",
            state: "CA",
            zip: "94117",
            country: "US"
        };
        const addressTo = {
            name: "Mr Hippo",
            street1: "Broadway 1",
            city: "New York",
            state: "NY",
            zip: "10007",
            country: "US"
        };
        const parcel = {
            length: "5",
            width: "5",
            height: "5",
            distance_unit: "in",
            weight: "2",
            mass_unit: "lb"
        };

        shippo.shipment.create({
            address_from: addressFrom,
            address_to: addressTo,
            parcels: [parcel],
            async: false
        })
        .then(data => {
            callback(null, data);
        })
        .catch(err => {
            let customError = handleShippoError(err);
            callback(customError);
        });
    },
};
