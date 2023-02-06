package com.mth.fastfood;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.TextPaint;
import android.text.method.LinkMovementMethod;
import android.text.style.ClickableSpan;
import android.view.MenuItem;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.MainThread;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

public class RegisterActivity extends AppCompatActivity {
    
    private Toolbar mToolbar;
    
    private TextView text_sing_in;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);
            
        main();
        logic();
        
    }
    
    public void main() {
        mToolbar = (Toolbar) findViewById(R.id.toolbar);
        text_sing_in = (TextView) findViewById(R.id.link_sing_in);
    }
    
    public void logic() {
        mToolbar.setTitle("");
        setSupportActionBar(mToolbar);
        getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        
        String key = "aqui";
        
        CharSequence text_1 = text_sing_in.getText();
        int index_start = text_1.toString().indexOf(key);
        int index_end = index_start + key.length();
        
        Spannable span_1 = new SpannableStringBuilder(text_1.toString());
        ClickableSpan cl_1 = new ClickableSpan() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(RegisterActivity.this, LoginActivity.class);
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
        
        text_sing_in.setText(span_1);
        text_sing_in.setMovementMethod(LinkMovementMethod.getInstance());
        text_sing_in.setHighlightColor(Color.TRANSPARENT);
        
    }
    
    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        
        switch (item.getItemId()) {
            case android.R.id.home:
                onBackPressed();
            break;
        }
        
        return true;
    }
        
    
    public void btnClick(View view) {
        alerta("Cadastro não é salvo");
    }
    
    public void alerta(String str) {
        Toast.makeText(this, str, Toast.LENGTH_SHORT).show();
    }
    
    @Override
    @MainThread
    public void onBackPressed() {
        super.onBackPressed();
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }
    
}
