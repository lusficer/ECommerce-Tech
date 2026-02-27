package com.Lusficer.UserService.config;

import com.p6spy.engine.spy.appender.MessageFormattingStrategy;

import java.text.SimpleDateFormat;
import java.util.Date;

public class P6SpyCustomFormatter implements MessageFormattingStrategy {
    private static final SimpleDateFormat FORMAT = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss:SSS");

    @Override
    public String formatMessage(int connectionId, String now, long elapsed, String category,
                              String prepared, String sql, String url) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n=============================== P6Spy SQL Log ===============================");
        sb.append("\nTimestamp     : ").append(FORMAT.format(new Date()));
        sb.append("\nElapsed time  : ").append(elapsed).append(" ms");
        if (prepared != null && !prepared.isEmpty()) {
            sb.append("\nPrepared SQL  : ").append(prepared);
        }
        if (sql != null && !sql.isEmpty()) {
            sb.append("\nExecuted SQL  : ").append(sql);
        }
        sb.append("\nConnection ID : ").append(connectionId);
        sb.append("\n==========================================================================\n");
        return sb.toString();
    }
}