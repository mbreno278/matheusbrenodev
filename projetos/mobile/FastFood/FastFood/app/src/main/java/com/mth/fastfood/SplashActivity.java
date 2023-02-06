package com.mth.fastfood;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import androidx.annotation.MainThread;
import androidx.appcompat.app.AppCompatActivity;
import com.mth.fastfood.OnBoardingActivity;
import com.mth.fastfood.SplashActivity;

public class SplashActivity extends AppCompatActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);
    }
    
    public void btnStart(View view) {
        Intent it = new Intent(SplashActivity.this, OnBoardingActivity.class);
        startActivity(it);
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }
    
    @Override
    @MainThread
    public void onBackPressed() {
        super.onBackPressed();
        
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }
    
}
