package com.mth.fastfood;

import android.os.Bundle;
import android.view.MenuItem;
import android.view.View;
import android.widget.Toast;
import androidx.annotation.MainThread;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

public class ForgotPasswordActivity extends AppCompatActivity {
    
    private Toolbar mToolbar;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_forgot_password);
        
        main();
        logic();
    }
    
    public void main() {
        mToolbar = (Toolbar) findViewById(R.id.toolbar);
    }
    
    public void logic() {
        
        mToolbar.setTitle("");
        setSupportActionBar(mToolbar);
        getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        
    }
    
    public void btnClick(View view) {
        alerta("Nenhuma ação feita");
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
