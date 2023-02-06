package com.mth.fastfood;

import android.animation.ObjectAnimator;
import android.content.Intent;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.widget.FrameLayout;
import androidx.annotation.MainThread;
import androidx.appcompat.app.ActionBarDrawerToggle;
import androidx.appcompat.app.AppCompatActivity;
import android.os.*;
import android.util.Log;
import android.content.Context;
import android.widget.Toast;
import androidx.appcompat.widget.Toolbar;
import androidx.cardview.widget.CardView;
import androidx.drawerlayout.widget.DrawerLayout;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import com.google.android.material.appbar.AppBarLayout;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.navigation.NavigationView;
import com.mth.fastfood.AccountActivity;
import com.mth.fastfood.MainActivity;
import com.mth.fastfood.SearchActivity;
import com.mth.fastfood.ShopCartActivity;
import com.mth.fastfood.SingleActivity;
import com.mth.fastfood.SplashActivity;
import com.mth.fastfood.databinding.ActivityMainBinding;
import com.itsaky.androidide.logsender.LogSender;
import com.mth.fastfood.fragments.BoardingStep1Fragment;
import com.mth.fastfood.fragments.ExploreFragment;
import com.mth.fastfood.fragments.HomeFragment;
import com.mth.fastfood.widget.MyEditText;

public class MainActivity extends AppCompatActivity implements BottomNavigationView.OnItemSelectedListener {
    
	private ActivityMainBinding binding;
    private AppBarLayout mAppBarLayout;
    private DrawerLayout mDrawerLayout;
    private Toolbar mToolbar;
    private NavigationView mNavigationView;
    private BottomNavigationView mNavigation;
    
    private FragmentManager mFragmentManager;
    private FragmentTransaction mFragmentTransaction;
    
    private int FRAGMENT_STATE = 1;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
		// Remove this line if you don't want AndroidIDE to show this app's logs
		LogSender.startLogging(this);
        super.onCreate(savedInstanceState);
        // Inflate and get instance of binding
		binding = ActivityMainBinding.inflate(getLayoutInflater());
        // set content view to binding's root
        setContentView(binding.getRoot());
        
        String data = this.getIntent().getStringExtra("data");
        
        String home = "";
        
        if (data != null) {
            home = data;
        }
        
        if (!home.equals("home")) {
            Intent it = new Intent(MainActivity.this, SplashActivity.class);
            it.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(it);
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
        }
        
        
        main();
        logic();
        drawer();
    }
    
    public void main() {
        mToolbar = (Toolbar) findViewById(R.id.toolbar);
        mDrawerLayout = (DrawerLayout) findViewById(R.id.drawer_layout);
        mAppBarLayout = (AppBarLayout) findViewById(R.id.app_bar_layout);
        mNavigation = (BottomNavigationView) findViewById(R.id.navigation);
        mNavigationView = (NavigationView) findViewById(R.id.navigation_view);
    }
    
    public void logic() {
        mToolbar.setTitle(getResources().getString(R.string.app_name));
        setSupportActionBar(mToolbar);
        
        ActionBarDrawerToggle toggle = new ActionBarDrawerToggle(this, mDrawerLayout, mToolbar, R.string.open_drawer, R.string.close_drawer);
        mDrawerLayout.addDrawerListener(toggle);
        
        toggle.syncState();
        
        mFragmentManager = getSupportFragmentManager();
        mFragmentTransaction = mFragmentManager.beginTransaction();
        mFragmentTransaction.add(R.id.frame_layout, new HomeFragment());
        mFragmentTransaction.commit();
        
        mNavigation.setOnItemSelectedListener(this);
    }
    
    public void drawer() {
        mNavigationView.setNavigationItemSelectedListener(new NavigationView.OnNavigationItemSelectedListener() {
            @Override
            public boolean onNavigationItemSelected(MenuItem item) {
                switch (item.getItemId()) {
                    case R.id.navigation_home:
                        mFragmentManager = getSupportFragmentManager();
                        mFragmentTransaction = mFragmentManager.beginTransaction();
                        mFragmentTransaction.replace(R.id.frame_layout, new HomeFragment());
                        mFragmentTransaction.commit();
                        FRAGMENT_STATE = 1;
                        
                        mAppBarLayout.setVisibility(View.VISIBLE);
                        mNavigation.setSelectedItemId(R.id.navigation_home);
                    break;
                    
                    case R.id.navigation_explore:
                        mFragmentManager = getSupportFragmentManager();
                        mFragmentTransaction = mFragmentManager.beginTransaction();
                        mFragmentTransaction.replace(R.id.frame_layout, new ExploreFragment());
                        mFragmentTransaction.commit();
                        FRAGMENT_STATE = 2;
                        
                        mAppBarLayout.setVisibility(View.VISIBLE);
                        mNavigation.setSelectedItemId(R.id.navigation_explore);
                    break;
                    
                    case R.id.navigation_account:
                        Intent intent = new Intent(MainActivity.this, AccountActivity.class);
                        startActivity(intent);
                        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
                    break;
                    
                    case R.id.navigation_sing_in:
                        Intent in_sing_in = new Intent(MainActivity.this, LoginActivity.class);
                        startActivity(in_sing_in);
                        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
                    break;
                    
                    case R.id.navigation_sing_up:
                        Intent in_sing_up = new Intent(MainActivity.this, RegisterActivity.class);
                        startActivity(in_sing_up);
                        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
                    break;
                    
                    case R.id.navigation_logout:
                        Intent in_logout = new Intent(MainActivity.this, SplashActivity.class);
                        startActivity(in_logout);
                        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
                    break;
                        
                }
                
                mDrawerLayout.close();
                    
                return true;
            }
        });
    }
    
    @Override
    public boolean onNavigationItemSelected(MenuItem item) {
        
        switch (item.getItemId()) {
            case R.id.navigation_home:
                mFragmentManager = getSupportFragmentManager();
                mFragmentTransaction = mFragmentManager.beginTransaction();
                mFragmentTransaction.replace(R.id.frame_layout, new HomeFragment());
                mFragmentTransaction.commit();
                FRAGMENT_STATE = 1;
                
                mAppBarLayout.setVisibility(View.VISIBLE);
                //mNavigation.setSelectedItemId(R.id.navigation_home);
            break;
            
            case R.id.navigation_explore:
                mFragmentManager = getSupportFragmentManager();
                mFragmentTransaction = mFragmentManager.beginTransaction();
                mFragmentTransaction.replace(R.id.frame_layout, new ExploreFragment());
                mFragmentTransaction.commit();
                FRAGMENT_STATE = 2;
                
                mAppBarLayout.setVisibility(View.VISIBLE);
                //mNavigation.setSelectedItemId(R.id.navigation_explore);
            break;
            
            case R.id.navigation_account:
                Intent intent = new Intent(MainActivity.this, AccountActivity.class);
                startActivity(intent);
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
            break;
        }
        
        return true;
    }
    
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        
        MenuInflater inflater = getMenuInflater();
        inflater.inflate(R.menu.menu_main, menu);
        
        return true;
    }
    
    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        
        switch (item.getItemId()) {
            case R.id.menu_main_shop_cart:
                Intent intent = new Intent(MainActivity.this, ShopCartActivity.class);
                startActivity(intent);
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
            break;
        }
        
        return true;
    }
    
    public void searchClick(View view) {
        Intent intent = new Intent(MainActivity.this, SearchActivity.class);
        startActivity(intent);
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
        
    }
    
    public void goSingle(View view) {
        Intent intent = new Intent(MainActivity.this, SingleActivity.class);
        startActivity(intent);
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        
        if (FRAGMENT_STATE == 1) {
            mNavigation.setSelectedItemId(R.id.navigation_home);
        }else {
            mNavigation.setSelectedItemId(R.id.navigation_explore);
        }
        
    }
    
    public void alerta(String str) {
        Toast.makeText(this, str, Toast.LENGTH_SHORT).show();
    }
    
    public void back() {
        mFragmentManager = getSupportFragmentManager();
        mFragmentTransaction = mFragmentManager.beginTransaction();
        mFragmentTransaction.replace(R.id.frame_layout, new HomeFragment());
        mFragmentTransaction.commit();
        
        mNavigation.setSelectedItemId(R.id.navigation_home);
        
        FRAGMENT_STATE = 1;
        
        mAppBarLayout.setVisibility(View.VISIBLE);
        mNavigationView.setVisibility(View.VISIBLE);
    }
    
    @Override
    @MainThread
    public void onBackPressed() {
        
        if (FRAGMENT_STATE != 1) {
            back();
        }else {
            super.onBackPressed();
        }
        
    }
    
    
}
