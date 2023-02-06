package com.mth.fastfood;

import android.content.Intent;
import android.graphics.Color;
import android.net.LinkAddress;
import android.os.Bundle;
import android.text.Spannable;
import android.text.SpannableString;
import android.text.SpannableStringBuilder;
import android.text.Spanned;
import android.text.TextPaint;
import android.text.method.LinkMovementMethod;
import android.text.style.ClickableSpan;
import android.text.style.ForegroundColorSpan;
import android.view.MenuItem;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.MainThread;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import com.mth.fastfood.ForgotPasswordActivity;
import com.mth.fastfood.LoginActivity;
import com.mth.fastfood.MainActivity;
import com.mth.fastfood.RegisterActivity;

public class LoginActivity extends AppCompatActivity {
    
    private Toolbar mToolbar;
    
    private TextView text_forgot_password;
    private TextView text_sing_up;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);
        
        main();
        logic();
    }
    
    public void main() {
        mToolbar = (Toolbar) findViewById(R.id.toolbar);
        text_forgot_password = (TextView) findViewById(R.id.link_forgot_password);
        text_sing_up = (TextView) findViewById(R.id.link_sing_up);
    }
    
    public void logic() {
        mToolbar.setTitle("");
        setSupportActionBar(mToolbar);
        getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        
        String key = "aqui";
        
        CharSequence text_1 = text_forgot_password.getText();
        int index_start = text_1.toString().indexOf(key);
        int index_end = index_start + key.length();
        
        Spannable span_1 = new SpannableStringBuilder(text_1.toString());
        ClickableSpan cl_1 = new ClickableSpan() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(LoginActivity.this, ForgotPasswordActivity.class);
                startActivity(intent);
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
            }
            
            @Override
            public void updateDrawState(TextPaint tp) {
                super.updateDrawState(tp);
                tp.setUnderlineText(false);
                tp.setColor(getResources().getColor(R.color.red_500));
            }
        };
        
        span_1.setSpan(
            cl_1,
            index_start,
            index_end,
            Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
        );
        
        text_forgot_password.setText(span_1);
        text_forgot_password.setMovementMethod(LinkMovementMethod.getInstance());
        text_forgot_password.setHighlightColor(Color.TRANSPARENT);
        
        CharSequence text_2 = text_sing_up.getText();
        int index_start_2 = text_2.toString().indexOf(key);
        int index_end_2 = index_start_2 + key.length();
        
        Spannable span_2 = new SpannableStringBuilder(text_2.toString());
        ClickableSpan cl_2 = new ClickableSpan() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(LoginActivity.this, RegisterActivity.class);
                startActivity(intent);
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
            }
            
            @Override
            public void updateDrawState(TextPaint tp) {
                super.updateDrawState(tp);
                tp.setUnderlineText(false);
                tp.setColor(getResources().getColor(R.color.red_500));
            }
        };
        
        span_2.setSpan(
            cl_2,
            index_start_2,
            index_end_2,
            Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
        );
        
        text_sing_up.setText(span_2);
        text_sing_up.setMovementMethod(LinkMovementMethod.getInstance());
        text_sing_up.setHighlightColor(Color.TRANSPARENT);
        
    }
    
    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        
        switch (item.getItemId()) {
            case android.R.id.home:
                finish();
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
            break;
        }
        
        return true;
    }
    
    public void btnClick(View view) {
        Intent intent = new Intent(LoginActivity.this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.putExtra("data", "home");
        startActivity(intent);
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }
    
    public void alert(String value) {
        Toast.makeText(this, value, Toast.LENGTH_SHORT).show();
    }
    
    @Override
    @MainThread
    public void onBackPressed() {
        super.onBackPressed();
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }
    
}
