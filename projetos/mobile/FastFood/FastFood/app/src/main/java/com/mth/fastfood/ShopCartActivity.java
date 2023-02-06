package com.mth.fastfood;

import android.graphics.Color;
import android.os.Bundle;
import android.view.MenuItem;
import android.view.View;
import android.widget.LinearLayout;
import androidx.annotation.MainThread;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.widget.NestedScrollView;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.appbar.AppBarLayout;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.mth.fastfood.adapter.RecyclerViewAdapter;
import com.mth.fastfood.inter.OnItemClickListener;
import com.mth.fastfood.utils.ProductArray;
import com.mth.fastfood.utils.SwipeToDeleteCallback;
import androidx.recyclerview.widget.ItemTouchHelper;
import java.util.ArrayList;
import com.google.android.material.snackbar.Snackbar;

public class ShopCartActivity extends AppCompatActivity {
    
    private AppBarLayout mAppBarLayout;
    private MaterialToolbar mToolbar;
    
    private RecyclerView mRecycler;
    private RecyclerViewAdapter mAdapter;
    private LinearLayoutManager llm;
    private ArrayList<ProductArray> array_list = new ArrayList<ProductArray>();
    private LinearLayout mLinearLayout;
    
    private NestedScrollView mNestedScrollView;
    private BottomNavigationView mBottomNavigationView;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_shop_cart);
        
        main();
        logic();
        enableSwipeToDeleteAndUndo();
    }
    
    
    public void main() {
        mAppBarLayout = (AppBarLayout) findViewById(R.id.appbar);
        mToolbar = (MaterialToolbar) findViewById(R.id.toolbar);
        mRecycler = (RecyclerView) findViewById(R.id.recycler_view);
        llm = new LinearLayoutManager(this);
        mLinearLayout = (LinearLayout) findViewById(R.id.layout_content);
        mNestedScrollView = (NestedScrollView) findViewById(R.id.nested_scroll_view);
        mBottomNavigationView = (BottomNavigationView) findViewById(R.id.bottom_navigation_view);
    }
    
    public void logic() {
        mToolbar.setTitle("Carrinho de compras");
        setSupportActionBar(mToolbar);
        getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        
        mRecycler.setHasFixedSize(true);
        mRecycler.setLayoutManager(llm);
        
        int img[] = {
            R.drawable.hamburguer_01,
            R.drawable.hamburguer_02,
            R.drawable.hamburguer_03,
            R.drawable.hamburguer_04,
            R.drawable.hamburguer_05,
            R.drawable.hamburguer_06,
            R.drawable.hamburguer_07,
            R.drawable.hamburguer_08,
            R.drawable.hamburguer_09,
            R.drawable.hamburguer_10,
            R.drawable.hamburguer_11
        };
        
        for (int i = 0; img.length > i; i++) {
            ProductArray array = new ProductArray();
            array.setImage(img[i]);
            array.setTitle("Lorem ipsum dolor sit amet, consectetur adipiscing elit.");
            array.setAdrress("Endereço");
            array.setCampanyName("Empresa nome");
            array.setCampanyHour("Empresa Horário");

            array_list.add(array);
        }

        mAdapter = new RecyclerViewAdapter(this, R.layout.content_category, array_list);
        mRecycler.setAdapter(mAdapter);
        
        mAdapter.setOnItemClickListener(new OnItemClickListener() {
            @Override
            public void onClick(int position) {}
        });
        
        mNestedScrollView.setOnScrollChangeListener(new View.OnScrollChangeListener() {
            @Override
            public void onScrollChange(View v, int scrollX, int scrollY, int oldScrollX, int oldScrollY) {
                if (scrollY == 0) {
                    mAppBarLayout.setElevation(0);
                } else {
                    int elevation = (int) getResources().getDimension(R.dimen.elevation_level_2);
                    mAppBarLayout.setElevation(elevation);
                }
            }
        });
        
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
    
    public void enableSwipeToDeleteAndUndo() {
        SwipeToDeleteCallback swipeToDeleteCallback = new SwipeToDeleteCallback(this) {
            @Override
            public void onSwiped(RecyclerView.ViewHolder holder, int i) {
                
                final int position = holder.getAdapterPosition();
                final ProductArray item = mAdapter.getItem(position);
                
                mAdapter.removeItem(holder.getAdapterPosition());
                
                Snackbar snackbar = Snackbar.make(mLinearLayout, "Item removido", Snackbar.LENGTH_LONG);
                snackbar.setAnchorView(mBottomNavigationView);
                snackbar.setAction("Desfazer", new View.OnClickListener() {
                    @Override
                    public void onClick(View view) {
                        mAdapter.restoreItem(item, position);
                        mRecycler.scrollToPosition(position);
                    }
                });
                
                snackbar.setActionTextColor(Color.YELLOW);
                snackbar.show();
                
            }
        };
        
        ItemTouchHelper itemTouchhelper = new ItemTouchHelper(swipeToDeleteCallback);
        itemTouchhelper.attachToRecyclerView(mRecycler);
    }
    
    public void btnClick(View view) {
        
    }
    
    @Override
    @MainThread
    public void onBackPressed() {
        super.onBackPressed();
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }
    
    
}
