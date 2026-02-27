package com.Lusficer.FulfillmentService.service;

import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import com.Lusficer.FulfillmentService.entity.Shipment;
import com.Lusficer.FulfillmentService.entity.ShipmentItem;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;

@Service
public class PdfLabelService {
    public byte[] generateLabel(Shipment shipment) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();
            
            document.add(new Paragraph("=== SHIPPING LABEL ==="));
            document.add(new Paragraph("Shipment ID: " + shipment.getShipmentId()));
            document.add(new Paragraph("Order ID: " + shipment.getOrderId()));
            document.add(new Paragraph("From Shop: " + shipment.getShopId()));
            document.add(new Paragraph("----------------------"));
            document.add(new Paragraph("ITEMS:"));
            
            for (ShipmentItem item : shipment.getItems()) {
                document.add(new Paragraph("- " + item.getProductName() + " (x" + item.getQuantity() + ")"));
            }
            
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error creating PDF", e);
        }
    }
}