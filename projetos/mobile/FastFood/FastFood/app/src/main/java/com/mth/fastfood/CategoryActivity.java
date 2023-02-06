package com.mth.fastfood;

import android.content.Intent;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.widget.Toast;
import androidx.annotation.MainThread;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.core.widget.NestedScrollView;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.appbar.AppBarLayout;
import com.mth.fastfood.CategoryActivity;
import com.mth.fastfood.adapter.RecyclerViewAdapter;
import com.mth.fastfood.inter.OnItemClickListener;
import com.mth.fastfood.utils.ProductArray;
import java.util.ArrayList;

public class CategoryActivity extends AppCompatActivity {

    private AppBarLayout mAppBarLayout;
    private Toolbar mToolbar;
    private NestedScrollView mNestedScrollView;
    private String category_name;

    private RecyclerView mRecycler;
    private RecyclerViewAdapter mAdapter;
    private LinearLayoutManager llm;
    private ArrayList<ProductArray> array_list = new ArrayList<ProductArray>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_category);

        String category = getIntent().getStringExtra("category_name");
        category_name = category;

        main();
        logic();
    }

    public void main() {
        mAppBarLayout = (AppBarLayout) findViewById(R.id.app_bar_layout);
        mToolbar = (Toolbar) findViewById(R.id.toolbar);
        mNestedScrollView = (NestedScrollView) findViewById(R.id.nested_scroll_view);
        mRecycler = (RecyclerView) findViewById(R.id.recycler_view);
        llm = new LinearLayoutManager(this);
    }

    public void logic() {
        mToolbar.setTitle(category_name);
        setSupportActionBar(mToolbar);
        getSupportActionBar().setDisplayHomeAsUpEnabled(true);

        mNestedScrollView.setOnScrollChangeListener(
                new View.OnScrollChangeListener() {
                    @Override
                    public void onScrollChange(
                            View v, int scrollX, int scrollY, int oldScrollX, int oldScrollY) {
                        if (scrollY == 0) {
                            mAppBarLayout.setElevation(0);
                        } else {
                            int elevation =
                                    (int) getResources().getDimension(R.dimen.elevation_level_2);
                            mAppBarLayout.setElevation(elevation);
                        }
                    }
                });

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
            R.drawable.hamburguer_09
        };

        if (category_name.equals("Hambúrguer 1")) {
            int hamburgue[] = {
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

            img = hamburgue;

        } else if (category_name.equals("Hambúrguer 2")) {
            int hamburgue[] = {
                R.drawable.hamburguer_01_01,
                R.drawable.hamburguer_01_02,
                R.drawable.hamburguer_01_03,
                R.drawable.hamburguer_01_04
            };

            img = hamburgue;
        }else if (category_name.equals("Pizza")) {
            int pizza[] = {
                R.drawable.pizza_01,
                R.drawable.pizza_02,
                R.drawable.pizza_03,
                R.drawable.pizza_04,
                R.drawable.pizza_05,
                R.drawable.pizza_06,
                R.drawable.pizza_07
            };

            img = pizza;
        }else if (category_name.equals("Variados")) {
            int variados[] = {
                R.drawable.variados_01,
                R.drawable.variados_02,
                R.drawable.variados_03,
                R.drawable.variados_04,
                R.drawable.variados_05,
                R.drawable.variados_06,
                R.drawable.variados_07,
                R.drawable.variados_08,
                R.drawable.variados_09,
                R.drawable.variados_10,
                R.drawable.variados_11,
                R.drawable.variados_12,
                R.drawable.variados_13,
                R.drawable.variados_14,
                R.drawable.variados_15,
                R.drawable.variados_16,
                R.drawable.variados_17,
                R.drawable.variados_18,
                R.drawable.variados_19,
                R.drawable.variados_20,
                R.drawable.variados_21,
                R.drawable.variados_22,
                R.drawable.variados_23,
                R.drawable.variados_24
            };
            
            img = variados;
        }

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
            public void onClick(int position) {
                    Intent intent = new Intent(CategoryActivity.this, SingleActivity.class);
                    intent.putExtra("imageID", array_list.get(position).getImage());
                    startActivity(intent);
            }
        });
    }
    
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        
        MenuInflater inflater = getMenuInflater();
        inflater.inflate(R.menu.menu_category, menu);
        
        return true;
    }
    
    @Override
    public boolean onOptionsItemSelected(MenuItem item) {

        switch (item.getItemId()) {
            case android.R.id.home:
                onBackPressed();
            break;
            
            case R.id.menu_category_shop_cart:
                Intent intent = new Intent(CategoryActivity.this, ShopCartActivity.class);
                startActivity(intent);
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
            break;
        }

        return true;
    }

    public void alerta(String str) {
        Toast.makeText(this, str, Toast.LENGTH_SHORT).show();
    }

    public void goSingle(View view) {
        Intent intent = new Intent(CategoryActivity.this, SingleActivity.class);
        startActivity(intent);
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }

    @Override
    @MainThread
    public void onBackPressed() {
        super.onBackPressed();
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }
}
