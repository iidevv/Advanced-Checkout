<?php

namespace Iidev\AdvancedCheckout\View;

use XCart\Extender\Mapping\Extender;

/**
 * @Extender\Mixin
 */
abstract class Checkout extends \XLite\View\Checkout
{
    public function getCSSFiles()
    {
        $list = parent::getCSSFiles();
        $list[] = 'modules/Iidev/AdvancedCheckout/style.css';

        return $list;
    }

    public function getJSFiles()
    {
        $list = parent::getJSFiles();

        $list[] = 'modules/Iidev/AdvancedCheckout/inputmask.min.js';
        $list[] = 'modules/Iidev/AdvancedCheckout/controller.js';

        return $list;
    }
}
