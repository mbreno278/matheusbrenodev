package com.mth.fastfood;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import androidx.annotation.MainThread;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import androidx.viewpager.widget.ViewPager;
import com.mth.fastfood.LoginActivity;
import com.mth.fastfood.MainActivity;
import com.mth.fastfood.OnBoardingActivity;
import com.mth.fastfood.adapter.ViewPagerAdapter;
import com.mth.fastfood.fragments.BoardingStep1Fragment;
import com.mth.fastfood.fragments.BoardingStep2Fragment;
import com.mth.fastfood.fragments.BoardingStep3Fragment;
import java.util.ArrayList;
import com.google.android.material.tabs.TabLayout;

public class OnBoardingActivity extends AppCompatActivity {
    
    private ViewPager mViewPager;
    private ViewPagerAdapter mViewPagerAdapter;
    private TabLayout mTab;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_on_boarding);
        
        main();
        logic();
    }
    
    public void main() {
        mViewPager = (ViewPager) findViewById(R.id.view_page);
        mTab = (TabLayout) findViewById(R.id.tab_layout);
    }
    
    public void logic() {
        
        ArrayList<Fragment> array = new ArrayList<Fragment>();
        
        array.add(new BoardingStep1Fragment());
        array.add(new BoardingStep2Fragment());
        array.add(new BoardingStep3Fragment());
        
        mViewPagerAdapter = new ViewPagerAdapter(getSupportFragmentManager(), array);
        mViewPager.setAdapter(mViewPagerAdapter);
        mTab.setupWithViewPager(mViewPager, true);
            
    }
    
    public void btnClick(View view) {
        Intent intent = null;
        
        switch (view.getId()) {
            case R.id.btn_access_account:
                intent = new Intent(OnBoardingActivity.this, LoginActivity.class);
                startActivity(intent);
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
            break;
            
            case R.id.btn_access_direct:
                intent = new Intent(OnBoardingActivity.this, MainActivity.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);
                intent.putExtra("data", "home");
                startActivity(intent);
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
            break;
        }
    }
    
    @Override
    @MainThread
    public void onBackPressed() {
        super.onBackPressed();
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }
        
    
}
