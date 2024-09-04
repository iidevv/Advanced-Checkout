<?php

namespace Iidev\AdvancedCheckout\Controller\Customer;

use XCart\Extender\Mapping\Extender;

/**
 * @Extender\Mixin
 */
class Checkout extends \XLite\Controller\Customer\Checkout
{
    public function defineCommonJSData()
    {
        $list = parent::defineCommonJSData();

        $list['google_api_key'] = \XLite\Core\Config::getInstance()->Iidev->AdvancedCheckout->google_api_key;

        return $list;
    }

    /**
     * @return string
     */
    public function getShippingPageURL()
    {
        return \XLite\Core\Config::getInstance()->Iidev->AdvancedCheckout->shipping_page_url;
    }
}
