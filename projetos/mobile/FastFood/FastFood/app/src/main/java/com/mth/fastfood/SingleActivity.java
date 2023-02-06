package com.mth.fastfood;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.MenuItem;
import android.view.View;
import android.widget.ImageButton;
import android.widget.ImageView;
import androidx.annotation.MainThread;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.lifecycle.ViewModel;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.appbar.CollapsingToolbarLayout;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.mth.fastfood.SingleActivity;
import com.mth.fastfood.adapter.RecyclerViewAdapter;
import com.mth.fastfood.inter.OnItemClickListener;
import com.mth.fastfood.utils.ProductArray;
import java.util.ArrayList;

public class SingleActivity extends AppCompatActivity {
    
    private Toolbar mToolbar;
    
    private ImageView mImageView;
    private int imageID;
    
    private RecyclerView mRecycler;
    private RecyclerViewAdapter mAdapter;
    private LinearLayoutManager llm;
    private ArrayList<ProductArray> array_list = new ArrayList<ProductArray>();
    
    private FloatingActionButton fab;
    
    private ImageButton btnFavorito;
    private boolean isFavorite = false;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_single);
        
        imageID = getIntent().getIntExtra("imageID", 0);
        
        main();
        logic();
    }
    
    public void main() {
        mToolbar = (Toolbar) findViewById(R.id.toolbar);
        mImageView = (ImageView) findViewById(R.id.collapse_image);
        mRecycler = (RecyclerView) findViewById(R.id.recycler_view);
        llm = new LinearLayoutManager(this);
        fab = (FloatingActionButton) findViewById(R.id.fab);
        btnFavorito = (ImageButton) findViewById(R.id.btn_add_favorito);
    }
    
    public void logic() {
        mToolbar.setTitle("");
        setSupportActionBar(mToolbar);
        getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        
        mImageView.setImageResource(imageID);
        
        mRecycler.setHasFixedSize(true);
        mRecycler.setLayoutManager(llm);
        
        int img[] = {
            R.drawable.hamburguer_01,
            R.drawable.hamburguer_02,
            R.drawable.hamburguer_03,
            R.drawable.hamburguer_04,
            R.drawable.hamburguer_05
        };
        
        for (int i = 0; img.length > i; i++) {
            ProductArray array = new ProductArray();
            array.setImage(img[i]);
            array.setTitle("Lorem ipsum dolor sit amet, consectetur adipiscing elit.");
            array.setAdrress("Endereço da loja");
            array.setCampanyName("Nome da loja");
            array.setCampanyHour("Horário de funcionamento");
            
            array_list.add(array);
        }
        
        mAdapter = new RecyclerViewAdapter(this, R.layout.content_category, array_list);
        mRecycler.setAdapter(mAdapter);
        
        mAdapter.setOnItemClickListener(new OnItemClickListener() {
            @Override
            public void onClick(int position) {
                    Intent intent = new Intent(SingleActivity.this, SingleActivity.class);
                    intent.putExtra("imageID", array_list.get(position).getImage());
                    startActivity(intent);
            }
        });
        
        btnFavorito.setOnClickListener(new View.OnClickListener() {
            @Override
                public void onClick(View v) {
                    if (!isFavorite) {
                        btnFavorito.setImageResource(R.drawable.ic_favorite);
                        isFavorite = true;
                    }else {
                        btnFavorito.setImageResource(R.drawable.ic_favorite_border);
                        isFavorite = false;
                    }
                }
        });
        
        fab.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                    Intent intent = new Intent(SingleActivity.this, ShopCartActivity.class);
                    startActivity(intent);
                    overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
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
    
    @Override
    @MainThread
    public void onBackPressed() {
        super.onBackPressed();
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }
        
    private class StarView extends ViewModel {
        
        public StarView(Context ctx) {
            //super(ctx);
        }
        
    }
}
