package com.Lusficer.DisputeService.entity;

public enum DisputeReason {
    PAYMENT_ISSUE,      // Payment issues (incorrect charge, not received)
    RETURN_REFUND,      // Return or refund request
    DAMAGED_GOODS,      // Item damaged or broken
    ITEM_NOT_RECEIVED,  // Customer has not received the item
    WRONG_ITEM,         // Wrong item delivered
    OTHER               // Other reasons
}